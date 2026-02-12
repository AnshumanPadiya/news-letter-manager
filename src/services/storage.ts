import type { Category } from './processor';

export interface StoredNewsletter {
    id: string;
    subject: string;
    sender: string;
    summary: string;
    category: Category;
    receivedDate: string; // ISO string
    isArchived: boolean;
    importanceScore: number;
}

export interface ArchiveSettings {
    enableArchiving: boolean;
    archiveAfterDays: number; // 0 = immediate, 7 = 1 week, etc.
}

export interface AppSettings {
    openaiKey?: string;
    geminiKey?: string;
    archiveSettings: ArchiveSettings;
    customCategories: string[];
}

const DEFAULT_SETTINGS: AppSettings = {
    archiveSettings: {
        enableArchiving: false,
        archiveAfterDays: 30
    },
    customCategories: []
};

export class StorageService {
    static async saveNewsletters(newsletters: StoredNewsletter[]): Promise<void> {
        const result = await chrome.storage.local.get(['newsletters']);
        const existing = (result.newsletters as StoredNewsletter[]) || [];

        // Merge and deduplicate by ID
        const map = new Map<string, StoredNewsletter>();
        existing.forEach(n => map.set(n.id, n));
        newsletters.forEach(n => map.set(n.id, n));

        await chrome.storage.local.set({ newsletters: Array.from(map.values()) });
    }

    static async getNewsletters(): Promise<StoredNewsletter[]> {
        const result = await chrome.storage.local.get(['newsletters']);
        return (result.newsletters as StoredNewsletter[]) || [];
    }

    static async searchNewsletters(query: string): Promise<StoredNewsletter[]> {
        const all = await this.getNewsletters();
        if (!query) return all;

        const lowerQuery = query.toLowerCase();
        return all.filter(n =>
            n.subject.toLowerCase().includes(lowerQuery) ||
            n.summary.toLowerCase().includes(lowerQuery) ||
            n.sender.toLowerCase().includes(lowerQuery)
        );
    }

    static async getSettings(): Promise<AppSettings> {
        const result = await chrome.storage.local.get(['settings']);
        return { ...DEFAULT_SETTINGS, ...(result.settings || {}) };
    }

    static async saveSettings(settings: Partial<AppSettings>): Promise<void> {
        const current = await this.getSettings();
        const updated = { ...current, ...settings };
        await chrome.storage.local.set({ settings: updated });
    }

    static async markAsArchived(ids: string[]): Promise<void> {
        const all = await this.getNewsletters();
        const updated = all.map(n => ids.includes(n.id) ? { ...n, isArchived: true } : n);
        await chrome.storage.local.set({ newsletters: updated });
    }
}
