import { GmailClient } from './gmail';
import { LLMService, type BatchEmailData } from './llm';
import type { IGmailMessage, IMessagePart } from '../types/gmail';

export type Category = 'Tech' | 'Offers' | 'News' | 'Finance' | 'Entertainment' | 'Misc';

export interface ScoredNewsletter {
    message: IGmailMessage;
    score: number;
    summary: string;
    sender: string;
    subject: string;
    link: string;
    category: Category;
    isAiGenerated?: boolean;
}

export class NewsletterProcessor {
    static async fetchNewsletters(daysBack: number = 7, interactive: boolean = false): Promise<IGmailMessage[]> {
        const date = new Date();
        date.setDate(date.getDate() - daysBack);
        const afterDate = Math.floor(date.getTime() / 1000);

        const query = `category:promotions OR "unsubscribe" after:${afterDate}`;

        const response = await GmailClient.listMessages(query, 50, undefined, interactive);
        if (!response.messages) return [];

        const messages: IGmailMessage[] = [];
        const BATCH_SIZE = 5;

        for (let i = 0; i < response.messages.length; i += BATCH_SIZE) {
            const batch = response.messages.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map(msg => GmailClient.getMessage(msg.id, interactive))
            );
            messages.push(...batchResults);

            if (i + BATCH_SIZE < response.messages.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return messages;
    }

    static extractBody(payload?: IMessagePart): string {
        if (!payload) return '';

        let body = '';
        if (payload.body?.data) {
            body = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } else if (payload.parts) {
            for (const part of payload.parts) {
                if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
                    body += this.extractBody(part);
                }
            }
        }
        return body;
    }

    static getHeader(headers: any[], name: string): string {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
    }

    private static simpleFallbackCategory(subject: string, body: string): Category {
        const text = (subject + ' ' + body).toLowerCase();

        if (text.includes('% off') || text.includes('discount code') || text.includes('sale')) return 'Offers';
        if (text.includes('tech') || text.includes('code') || text.includes('developer')) return 'Tech';
        if (text.includes('finance') || text.includes('stock') || text.includes('invest')) return 'Finance';
        if (text.includes('news') || text.includes('briefing')) return 'News';
        if (text.includes('movie') || text.includes('game') || text.includes('streaming')) return 'Entertainment';

        return 'Misc';
    }

    static async scoreNewsletters(messages: IGmailMessage[]): Promise<ScoredNewsletter[]> {
        if (messages.length === 0) return [];

        // Get both API keys
        const storage = await chrome.storage.sync.get(['openaiApiKey', 'geminiApiKey']);
        const openaiKey: string | undefined = storage.openaiApiKey as string | undefined;
        const geminiKey: string | undefined = storage.geminiApiKey as string | undefined;
        console.log('API Keys - OpenAI:', !!openaiKey, '| Gemini:', !!geminiKey);

        // Simple pre-filtering
        const candidates = messages
            .map(msg => {
                const subject = this.getHeader(msg.payload?.headers || [], 'Subject');
                const from = this.getHeader(msg.payload?.headers || [], 'From');
                const body = this.extractBody(msg.payload);
                const date = this.getHeader(msg.payload?.headers || [], 'Date');

                return { msg, subject, from, body, date };
            })
            .filter(item => item.body.length > 200)
            .slice(0, 20);

        console.log(`Pre-filtered to ${candidates.length} candidates for AI analysis.`);

        const results: ScoredNewsletter[] = [];

        // AI Batch Processing with fallback
        if ((openaiKey || geminiKey) && candidates.length > 0) {
            try {
                const batchInput: BatchEmailData[] = candidates.map(item => ({
                    id: item.msg.id,
                    subject: item.subject,
                    body: item.body,
                    sender: item.from
                }));

                console.log(`Sending ${batchInput.length} emails to AI for analysis...`);
                const aiResults = await LLMService.analyzeBatch(batchInput, openaiKey, geminiKey);
                console.log(`Received ${aiResults.length} AI results.`);
                console.log('AI Results:', JSON.stringify(aiResults, null, 2));

                const newsletterResults = aiResults.filter(r => r.isNewsletter === true);
                console.log(`Filtered to ${newsletterResults.length} actual newsletters (excluded ${aiResults.length - newsletterResults.length} notifications).`);

                if (newsletterResults.length === 0) {
                    console.warn('⚠️ AI returned 0 newsletters! All emails were marked as non-newsletters.');
                }

                for (const aiResult of newsletterResults) {
                    const candidate = candidates.find(c => c.msg.id === aiResult.id);
                    if (candidate) {
                        console.log(`✅ Adding AI-scored newsletter: ${aiResult.summary} (score: ${aiResult.importanceScore})`);
                        results.push({
                            message: candidate.msg,
                            score: aiResult.importanceScore,
                            summary: aiResult.summary,
                            sender: candidate.from,
                            subject: candidate.subject,
                            link: `https://mail.google.com/mail/u/0/#inbox/${candidate.msg.id}`,
                            category: aiResult.category,
                            isAiGenerated: true
                        });
                    }
                }

                console.log(`Total AI-processed results: ${results.length}`);

            } catch (error) {
                console.error('AI Batch Processing failed, falling back to heuristics:', error);
            }
        }

        // Fallback - if AI failed or no API key
        if (results.length === 0) {
            console.log('Using fallback heuristic scoring.');
            for (const item of candidates) {
                const lowerSubject = item.subject.toLowerCase();
                const lowerFrom = item.from.toLowerCase();

                // Filter out obvious notifications and transactional emails
                const isNotification =
                    lowerFrom.includes('discord') ||
                    lowerFrom.includes('netflix') ||
                    lowerFrom.includes('prime video') ||
                    lowerFrom.includes('amazon') && lowerSubject.includes('season') ||
                    lowerSubject.includes('mentioned you') ||
                    lowerSubject.includes('tagged you') ||
                    lowerSubject.includes('upgrade your plan') ||
                    lowerSubject.includes('statement of account') ||
                    lowerSubject.includes('credit card update') ||
                    lowerSubject.includes('new season alert') ||
                    lowerSubject.includes('now streaming') ||
                    lowerFrom.includes('bank') && !lowerSubject.includes('newsletter');

                // Skip notifications
                if (isNotification) {
                    console.log(`Filtered out notification: ${item.subject}`);
                    continue;
                }

                // Only include if it looks like a newsletter
                const looksLikeNewsletter =
                    lowerSubject.includes('newsletter') ||
                    lowerSubject.includes('digest') ||
                    lowerSubject.includes('weekly') ||
                    lowerSubject.includes('edition') ||
                    lowerSubject.includes('issue') ||
                    lowerSubject.includes('wrap') ||
                    lowerSubject.includes('roundup') ||
                    item.body.length > 2000; // Long emails are likely newsletters

                if (!looksLikeNewsletter) {
                    console.log(`Filtered out non-newsletter: ${item.subject}`);
                    continue;
                }

                let score = 5;

                if (item.body.length > 2000) score += 2;
                if (['weekly', 'digest', 'edition'].some(k => lowerSubject.includes(k))) score += 2;

                results.push({
                    message: item.msg,
                    score,
                    summary: item.subject,
                    sender: item.from,
                    subject: item.subject,
                    link: `https://mail.google.com/mail/u/0/#inbox/${item.msg.id}`,
                    category: this.simpleFallbackCategory(item.subject, item.body),
                    isAiGenerated: false
                });
            }
        }

        results.sort((a, b) => b.score - a.score);
        return results.slice(0, 10);
    }

    static generateDigestHTML(topNewsletters: ScoredNewsletter[]): string {
        const categories: Category[] = ['Tech', 'Finance', 'Entertainment', 'Offers', 'News', 'Misc'];
        const categoryColors: Record<Category, string> = {
            'Tech': '#e3f2fd',
            'Finance': '#fff8e1',
            'Entertainment': '#f3e5f5',
            'Offers': '#e8f5e9',
            'News': '#fff3e0',
            'Misc': '#f5f5f5'
        };
        let contentHtml = '';

        categories.forEach(category => {
            const items = topNewsletters.filter(n => n.category === category);
            if (items.length > 0) {
                contentHtml += `
                    <h2 style="color: #444; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 25px;">${category}</h2>
                `;
                contentHtml += items.map(n => `
                    <div style="margin-bottom: 15px; padding: 15px; background-color: ${categoryColors[category]}; border-radius: 8px; border: 1px solid #e0e0e0;">
                        <h3 style="margin: 0 0 5px 0; font-size: 16px;">
                            <a href="${n.link}" style="text-decoration: none; color: #1a73e8;">${n.subject}</a>
                        </h3>
                        <p style="margin: 0 0 5px 0; color: #5f6368; font-size: 12px;">From: ${n.sender}</p>
                        <p style="margin: 0; font-size: 14px; color: #202124;">
                            ${n.isAiGenerated ? '<span style="background-color: #e8eaed; color: #3c4043; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 5px; vertical-align: middle;">✨ AI Summary</span>' : ''}
                            ${n.summary}
                        </p>
                        <p style="margin: 5px 0 0 0; color: #5f6368; font-size: 11px;">
                            Importance: ${n.score}/10
                        </p>
                    </div>
                `).join('');
            }
        });

        return `
      <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #202124; border-bottom: 2px solid #1a73e8; padding-bottom: 10px;">Weekly Reads</h1>
          <p>Here are your top ${topNewsletters.length} newsletters for this week:</p>
          ${contentHtml}
          <div style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
            Generated by Newsletter Manager Extension
          </div>
        </body>
      </html>
    `;
    }
}
