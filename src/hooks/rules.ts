import { useState, useEffect } from 'react';
import { StorageService, type AppSettings } from '../services/storage';
import { NewsletterProcessor } from '../services/processor';

/** Represents a scanned sender with metadata for classification. */
interface ScannedSender {
    /** The raw "From" header value. */
    sender: string;
    /** Number of emails received from this sender. */
    count: number;
    /** Whether the email content looks like a genuine newsletter. */
    isNewsletter: boolean;
    /** Whether the email content looks like marketing/promotional. */
    isMarketing: boolean;
    /** Whether the email content looks like spam. */
    isSpam: boolean;
}

export const useRules = () => {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [spamSuggestions, setSpamSuggestions] = useState<string[]>([]);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await StorageService.getSettings();
            console.log("Settings loaded:", data);
            setSettings(data);
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async (newSettings: AppSettings) => {
        setSettings(newSettings);
        await StorageService.saveSettings(newSettings);
    };

    const addSender = (type: 'whitelist' | 'blacklist', input: string) => {
        if (!settings) return;
        
        const list = type === 'whitelist' ? settings.whitelistedSenders : settings.blacklistedSenders;
        const key = type === 'whitelist' ? 'whitelistedSenders' : 'blacklistedSenders';

        if (input && !list.includes(input)) {
            const updatedList = [...list, input];
            saveSettings({ ...settings, [key]: updatedList });
        }
    };

    const deleteSender = (type: 'whitelist' | 'blacklist', sender: string) => {
        if (!settings) return;
        
        const list = type === 'whitelist' ? settings.whitelistedSenders : settings.blacklistedSenders;
        const key = type === 'whitelist' ? 'whitelistedSenders' : 'blacklistedSenders';
        
        const updatedList = list.filter(s => s !== sender);
        saveSettings({ ...settings, [key]: updatedList });
    };

    const updateSetting = (key: keyof AppSettings, value: number) => {
        if (!settings) return;
        saveSettings({ ...settings, [key]: value });
    };

    /**
     * Classifies a single email as newsletter, marketing, or spam.
     * Uses keyword-based heuristics on subject, sender, and body.
     */
    const classifyEmail = (subject: string, sender: string, body: string): { isNewsletter: boolean; isMarketing: boolean; isSpam: boolean } => {
        const lowerSubject = subject.toLowerCase();
        const lowerSender = sender.toLowerCase();
        const lowerBody = body.substring(0, 1000).toLowerCase();
        const text = lowerSubject + ' ' + lowerSender + ' ' + lowerBody;

        // Marketing / Promotional signals
        const marketingKeywords = [
            'sale', '% off', 'discount', 'shop now', 'limited time', 'best deal',
            'free shipping', 'get it now', 'last chance', 'price drop', 'clearance',
            'exclusive access', 'new arrival', 'final hours', 'save big',
            'buy one', 'promo code', 'coupon', 'flash sale', 'act now',
            'order now', 'lowest price', 'special offer', 'deal of the day',
            'hurry', 'expires soon', 'while supplies last', 'add to cart'
        ];

        // Newsletter signals
        const newsletterKeywords = [
            'newsletter', 'digest', 'weekly', 'edition', 'issue #',
            'roundup', 'briefing', 'substack', 'daily brief', 'monthly',
            'top stories', 'this week in', 'what we read', 'curator',
            'curated', 'the latest', 'in this issue', 'read time'
        ];

        // Spam / Low-quality newsletter signals
        const spamKeywords = [
            'click here', 'act fast', 'limited spots', 'exclusive invite',
            'you won', 'congratulations', 'claim your', 'guaranteed',
            'risk free', 'no obligation', 'double your', 'earn money',
            'work from home', 'be your own boss', 'crypto opportunity',
            'investment opportunity'
        ];

        const hasMarketingSignals = marketingKeywords.some(k => text.includes(k));
        const hasNewsletterSignals = newsletterKeywords.some(k => text.includes(k));
        const hasSpamSignals = spamKeywords.some(k => text.includes(k));
        const hasLongContent = body.length > 2000;
        const hasUnsubscribeLink = lowerBody.includes('unsubscribe');

        // Classification priority:
        // 1. If it has strong newsletter signals and no marketing → genuine newsletter
        // 2. If it mostly has marketing signals → marketing (skip)
        // 3. If it has spam signals or looks like low-quality content → spam newsletter
        // 4. Long content with unsubscribe link but no newsletter keywords → could be spam

        const isMarketing = hasMarketingSignals && !hasNewsletterSignals;
        const isNewsletter = hasNewsletterSignals && !hasSpamSignals && !isMarketing;
        const isSpam = hasSpamSignals || (hasUnsubscribeLink && !hasNewsletterSignals && !hasMarketingSignals && !hasLongContent);

        return { isNewsletter, isMarketing, isSpam };
    };

    /**
     * Scans the inbox for newsletter suggestions and spam detections.
     * Results are split into two lists:
     * - `suggestions`: Genuine newsletters the user may want to whitelist.
     * - `spamSuggestions`: Low-quality or spammy senders the user may want to unsubscribe from.
     */
    const scanSuggestions = async () => {
        setScanning(true);
        setSuggestions([]);
        setSpamSuggestions([]);

        try {
            const messages = await NewsletterProcessor.fetchNewsletters(7, 30); 
            const senderMap = new Map<string, ScannedSender>();
            
            for (const msg of messages) {
                const sender = NewsletterProcessor.getHeader(msg.payload?.headers || [], 'From');
                const subject = NewsletterProcessor.getHeader(msg.payload?.headers || [], 'Subject');
                const body = NewsletterProcessor.extractBody(msg.payload);
                
                // Skip senders already in whitelist or blacklist
                const alreadyListed = settings?.whitelistedSenders.some(s => sender.toLowerCase().includes(s.toLowerCase())) || 
                                      settings?.blacklistedSenders.some(s => sender.toLowerCase().includes(s.toLowerCase()));
                                      
                if (alreadyListed) continue;

                // Skip sensitive emails
                if (NewsletterProcessor.isSensitive(subject, sender, body.substring(0, 500))) continue;

                const { isNewsletter, isMarketing, isSpam } = classifyEmail(subject, sender, body);

                // Completely skip pure marketing — don't show them at all
                if (isMarketing) continue;

                // Aggregate by sender
                const existing = senderMap.get(sender);
                if (existing) {
                    existing.count++;
                    if (isNewsletter) existing.isNewsletter = true;
                    if (isSpam) existing.isSpam = true;
                } else {
                    senderMap.set(sender, {
                        sender,
                        count: 1,
                        isNewsletter,
                        isMarketing: false,
                        isSpam
                    });
                }
            }
            
            const newsletterSuggestions: string[] = [];
            const spamDetections: string[] = [];

            for (const entry of senderMap.values()) {
                if (entry.isSpam) {
                    spamDetections.push(entry.sender);
                } else if (entry.isNewsletter) {
                    newsletterSuggestions.push(entry.sender);
                }
            }

            setSuggestions(newsletterSuggestions.slice(0, 8));
            setSpamSuggestions(spamDetections.slice(0, 5));
        } catch (error) {
            console.error("Scan suggestions failed:", error);
        } finally {
            setScanning(false);
        }
    };

    return {
        settings,
        loading,
        scanning,
        suggestions,
        spamSuggestions,
        addSender,
        deleteSender,
        updateSetting,
        scanSuggestions
    };
};
