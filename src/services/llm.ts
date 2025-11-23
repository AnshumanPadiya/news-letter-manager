import OpenAI from 'openai';
import type { Category } from './processor';
import { GoogleGenAI } from '@google/genai';

export interface BatchEmailData {
    id: string;
    subject: string;
    body: string;
    sender: string;
}

export interface AIAnalysisResult {
    id: string;
    summary: string;
    category: Category;
    importanceScore: number;
    isNewsletter: boolean;
}

export class LLMService {
    // Main entry point - handles fallback logic
    static async analyzeBatch(
        emails: BatchEmailData[],
        openaiKey?: string,
        geminiKey?: string
    ): Promise<AIAnalysisResult[]> {
        if (emails.length === 0) return [];

        // Try OpenAI first if key is provided
        if (openaiKey && openaiKey.length > 0) {
            try {
                console.log('Trying OpenAI...');
                const result = await this.analyzeBatchOpenAI(emails, openaiKey);
                console.log('OpenAI succeeded!');
                return result;
            } catch (error: any) {
                console.warn('OpenAI failed, falling back to Gemini:', error.message);
            }
        }

        // Fallback to Gemini if OpenAI failed or no key
        if (geminiKey && geminiKey.length > 0) {
            try {
                console.log('Trying Gemini...');
                const result = await this.analyzeBatchGemini(emails, geminiKey);
                console.log('Gemini succeeded!');
                return result;
            } catch (error: any) {
                console.warn('Gemini failed, falling back to heuristics:', error.message);
            }
        }

        // Both failed or no keys provided
        console.log('No AI available, returning empty (processor will use heuristics)');
        return [];
    }

    private static async analyzeBatchOpenAI(
        emails: BatchEmailData[],
        apiKey: string
    ): Promise<AIAnalysisResult[]> {
        const openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });

        const prompt = this.buildPrompt(emails);

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant that analyzes newsletters and outputs JSON.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('No content received from OpenAI');

        return this.parseAIResponse(content);
    }

    private static async analyzeBatchGemini(
        emails: BatchEmailData[],
        apiKey: string
    ): Promise<AIAnalysisResult[]> {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = this.buildPrompt(emails);

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: prompt
        });

        const content = response.text;
        if (!content) throw new Error('No content received from Gemini');

        return this.parseAIResponse(content);
    }

    private static buildPrompt(emails: BatchEmailData[]): string {
        const emailListText = emails.map((e, index) => `
EMAIL #${index + 1} (ID: ${e.id}):
Sender: ${e.sender}
Subject: ${e.subject}
Body Snippet: ${e.body.slice(0, 500)}...
`).join('\n-----------------------------------\n');

        return `You are an expert newsletter curator. I have a list of ${emails.length} emails. 
Your task is to analyze each one and return a JSON array of objects.

CRITICAL: Only mark as newsletter if it's actual NEWSLETTER CONTENT. Exclude:
- One-time notifications (e.g., "You were tagged in X", "New season available", "Someone mentioned you")
- Transactional emails (bank statements, order confirmations, account reports, credit card updates)
- Social media alerts (Discord mentions, LinkedIn notifications, Twitter/X alerts)
- Single promotional emails (unless they're clearly part of a regular newsletter series)

A TRUE NEWSLETTER is:
- Regularly published content (weekly/daily digest, edition, issue, newsletter series)
- Curated articles, insights, or industry roundups
- Educational or informational content series with multiple topics
- From recognizable publishers (ByteByteGo, Lenny's Newsletter, tech blogs, news sites)

For each email, provide:
1. "id": The exact ID provided in the input.
2. "isNewsletter": true ONLY if it's a real newsletter, false for notifications/transactional emails.
3. "summary": A concise 1-sentence summary (only if isNewsletter is true, otherwise empty string).
4. "category": Choose exactly one: 'Tech', 'Offers', 'News', 'Finance', 'Entertainment', 'Misc'.
   - 'Tech': Software, AI, coding, startups, engineering newsletters.
   - 'Offers': Deal roundups, curated discount newsletters (NOT single promotions).
   - 'Finance': Investment newsletters, market analysis, crypto newsletters.
   - 'Entertainment': Movie/TV/game reviews, streaming recommendations newsletters.
   - 'News': General world news, daily briefings.
5. "importanceScore": A number from 1-10 (only for newsletters, 0 for non-newsletters).
   - 10 = Must read, high signal, very valuable content.
   - 5 = Moderate value, somewhat interesting.
   - 1 = Low value, spammy.
   - 0 = Not a newsletter.

Input Emails:
${emailListText}

Output strictly a valid JSON Array. Do not include markdown formatting. Just the raw JSON array.
Example:
[
    { "id": "123", "isNewsletter": true, "summary": "Weekly AI developments roundup", "category": "Tech", "importanceScore": 9 },
    { "id": "456", "isNewsletter": false, "summary": "", "category": "Misc", "importanceScore": 0 }
]`;
    }

    private static parseAIResponse(content: string): AIAnalysisResult[] {
        // Clean up potential markdown code blocks
        const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const parsed: AIAnalysisResult[] = JSON.parse(cleanedContent);

            // Validate and sanitize results
            const validCategories: Category[] = ['Tech', 'Offers', 'News', 'Finance', 'Entertainment', 'Misc'];

            return parsed.map(item => ({
                id: item.id,
                isNewsletter: typeof item.isNewsletter === 'boolean' ? item.isNewsletter : true,
                summary: item.summary || '',
                category: validCategories.includes(item.category) ? item.category : 'Misc',
                importanceScore: typeof item.importanceScore === 'number' ? item.importanceScore : 5
            }));

        } catch (e) {
            console.error('Failed to parse AI batch response:', cleanedContent);
            return [];
        }
    }
}
