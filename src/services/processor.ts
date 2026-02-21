import { type AppSettings } from './storage';
import { GmailClient } from './gmail';
import { LLMService, type BatchEmailData } from './llm';
import type { IGmailMessage, IMessagePart } from '../types';

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
    static isSensitive(subject: string, sender: string, body: string = ''): boolean {
        const sensitiveKeywords = [
            'password reset', 'verification code', 'verify your identity', 'security alert', 'login attempt',
            'bank statement', 'account statment', 'transaction alert', 'payment confirmation', 'receipt',
            'invoice', 'order confirmation', 'shipping update', 'delivery update', 'your order',
            'reset your password', 'one-time passcode', 'otp', 'authentication', '2fa', 'mfa'
        ];

        const sensitiveDomains = [
            'accounts.google.com', 'notify.stripe.com', 'paypal.com', 'venmo.com', 'cash.app',
            'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citi.com', 'capitalone.com',
            'amex.com', 'discover.com', 'fidelity.com', 'vanguard.com', 'schwab.com'
        ];

        const text = (subject + ' ' + sender + ' ' + body).toLowerCase();
        
        if (sensitiveKeywords.some(keyword => text.includes(keyword))) {
            return true;
        }

        if (sensitiveDomains.some(domain => sender.toLowerCase().includes(domain))) {
            return true;
        }

        return false;
    }

    static isMarketing(subject: string, sender: string, body: string): boolean {
        const marketingKeywords = [
            'sale', '% off', 'discount', 'shop now', 'limited time', 'offer',
            'free shipping', 'get it now', 'last chance', 'price drop',
            'exclusive access', 'new arrival', 'final hours', 'save big',
            'buy one', 'promo code', 'coupon'
        ];
        
        const newsletterKeywords = [
            'newsletter', 'digest', 'weekly', 'edition', 'issue', 'roundup', 'briefing', 
            'substack', 'linkedin.com/newsletters', 'daily', 'monthly'
        ];

        const text = (subject + ' ' + sender + ' ' + body).toLowerCase();

        // If it looks like a newsletter, whitelist it (ignore marketing check)
        if (newsletterKeywords.some(k => text.includes(k))) {
            return false;
        }

        // If it has marketing keywords, classify as marketing
        if (marketingKeywords.some(k => text.includes(k))) {
            return true;
        }

        return false;
    }

    static async fetchNewsletters(daysBack: number = 7, maxEmails: number = 50, interactive: boolean = false): Promise<IGmailMessage[]> {
        const date = new Date();
        date.setDate(date.getDate() - daysBack);
        const afterDate = Math.floor(date.getTime() / 1000);

        const query = `category:promotions OR "unsubscribe" after:${afterDate}`;

        const response = await GmailClient.listMessages(query, maxEmails * 2, undefined, interactive); // Fetch more to allow for filtering
        if (!response.messages) return [];

        const messages: IGmailMessage[] = [];
        const BATCH_SIZE = 5;

        // Limit processing to maxEmails or available messages
        const messagesToProcess = response.messages.slice(0, maxEmails);

        for (let i = 0; i < messagesToProcess.length; i += BATCH_SIZE) {
            const batch = messagesToProcess.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map(msg => GmailClient.getMessage(msg.id, interactive))
            );
            messages.push(...batchResults);

            if (i + BATCH_SIZE < messagesToProcess.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return messages;
    }

    // ... (extractBody, getHeader, simpleFallbackCategory remain the same) ...
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

        // Get settings
        const storage = await chrome.storage.local.get(['settings']); // Access local storage for settings
        // Fallback to sync for keys if not in local settings (migration support)
        const syncStorage = await chrome.storage.sync.get(['openaiApiKey', 'geminiApiKey']);
        
        const settings = (storage.settings || {}) as AppSettings;
        const whitelist: string[] = settings.whitelistedSenders || [];
        const blacklist: string[] = settings.blacklistedSenders || [];
        
        const openaiKey: string | undefined = settings.openaiKey || (syncStorage.openaiApiKey as string);
        const geminiKey: string | undefined = settings.geminiKey || (syncStorage.geminiApiKey as string);
        
        console.log('API Keys - OpenAI:', !!openaiKey, '| Gemini:', !!geminiKey);

        // Pre-filtering with Rules & Sensitivity
        const candidates = messages
            .map(msg => {
                const subject = this.getHeader(msg.payload?.headers || [], 'Subject');
                const from = this.getHeader(msg.payload?.headers || [], 'From');
                const body = this.extractBody(msg.payload);
                const date = this.getHeader(msg.payload?.headers || [], 'Date');

                return { msg, subject, from, body, date };
            })
            .filter(item => {
                // 1. Check Blacklist
                if (blacklist.some(blocked => item.from.toLowerCase().includes(blocked.toLowerCase()))) {
                    console.log(`Blocked by blacklist: ${item.from}`);
                    return false;
                }

                // 2. Check Sensitivity
                if (this.isSensitive(item.subject, item.from, item.body.substring(0, 500))) {
                    console.log(`Skipped sensitive email: ${item.subject} from ${item.from}`);
                    return false;
                }

                // 3. Check Marketing/Promotional (New)
                if (this.isMarketing(item.subject, item.from, item.body.substring(0, 500))) {
                    console.log(`Skipped marketing email: ${item.subject} from ${item.from}`);
                    return false;
                }
                
                // 4. Length Check (keep existing logic)
                return item.body.length > 200;
            });
            
        // Prioritize Whitelist (Move to top or ensure they are kept)
        // We will just mark them for potential boost later, but for now they are just in candidates.
        
        const limitedCandidates = candidates.slice(0, 20); // Keep top 20 after filtering

        console.log(`Pre-filtered to ${limitedCandidates.length} candidates for AI analysis.`);

        const results: ScoredNewsletter[] = [];

        // AI Batch Processing with fallback
        if ((openaiKey || geminiKey) && limitedCandidates.length > 0) {
            try {
                const batchInput: BatchEmailData[] = limitedCandidates.map(item => ({
                    id: item.msg.id,
                    subject: item.subject,
                    body: item.body,
                    sender: item.from
                }));

                console.log(`Sending ${batchInput.length} emails to AI for analysis...`);
                const aiResults = await LLMService.analyzeBatch(batchInput, openaiKey, geminiKey);
                console.log(`Received ${aiResults.length} AI results.`);

                const newsletterResults = aiResults.filter(r => r.isNewsletter === true);
                
                // Check whitelist for forced inclusion? 
                // If AI says "not newsletter" but it is in whitelist, we should probably include it anyway?
                // For now, let's stick to AI's decision but maybe boost score if whitelisted.

                for (const aiResult of newsletterResults) {
                    const candidate = limitedCandidates.find(c => c.msg.id === aiResult.id);
                    if (candidate) {
                        let score = aiResult.importanceScore;
                        
                        // Boost score for whitelisted senders
                        if (whitelist.some(allowed => candidate.from.toLowerCase().includes(allowed.toLowerCase()))) {
                            score = Math.min(10, score + 3);
                        }

                        console.log(`✅ Adding AI-scored newsletter: ${aiResult.summary} (score: ${score})`);
                        results.push({
                            message: candidate.msg,
                            score: score,
                            summary: aiResult.summary,
                            sender: candidate.from,
                            subject: candidate.subject,
                            link: `https://mail.google.com/mail/u/0/#inbox/${candidate.msg.id}`,
                            category: aiResult.category,
                            isAiGenerated: true
                        });
                    }
                }

            } catch (error) {
                console.error('AI Batch Processing failed, falling back to heuristics:', error);
            }
        }

        // Fallback - if AI failed or no API key OR if we want to ensure coverage
        // Note: The original logic only ran fallback if results.length === 0.
        // We might want to run fallback for items NOT processed by AI if we want to fill up to 10?
        // For now, keeping original behavior: only run fallback if AI produced NOTHING.
        
        if (results.length === 0) {
            console.log('Using fallback heuristic scoring.');
            for (const item of limitedCandidates) {
                const lowerSubject = item.subject.toLowerCase();
                const lowerFrom = item.from.toLowerCase();

                // Whitelist check for explicit inclusion
                const isWhitelisted = whitelist.some(allowed => lowerFrom.includes(allowed.toLowerCase()));

                // Standard Notification checks
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
                    lowerSubject.includes('now streaming');

                if (isNotification && !isWhitelisted) {
                    continue;
                }

                // Heuristic Check
                const looksLikeNewsletter =
                    isWhitelisted || // Automatically looks like newsletter if whitelisted
                    lowerSubject.includes('newsletter') ||
                    lowerSubject.includes('digest') ||
                    lowerSubject.includes('weekly') ||
                    lowerSubject.includes('edition') ||
                    lowerSubject.includes('issue') ||
                    lowerSubject.includes('wrap') ||
                    lowerSubject.includes('roundup') ||
                    item.body.length > 2000;

                if (!looksLikeNewsletter) {
                    continue;
                }

                let score = 5;
                if (item.body.length > 2000) score += 2;
                if (['weekly', 'digest', 'edition'].some(k => lowerSubject.includes(k))) score += 2;
                if (isWhitelisted) score += 3; // Boost for whitelist

                results.push({
                    message: item.msg,
                    score: Math.min(10, score),
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
