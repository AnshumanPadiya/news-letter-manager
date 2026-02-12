import { GmailClient } from './gmail';
import { StorageService } from './storage';

export class ArchiverService {
    static async checkAndArchive(): Promise<number> {
        const settings = await StorageService.getSettings();

        // 1. Check if archiving is enabled
        if (!settings.archiveSettings.enableArchiving) {
            console.log('Archiving is disabled.');
            return 0;
        }

        const daysThreshold = settings.archiveSettings.archiveAfterDays;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        // 2. Get all stored newsletters
        const newsletters = await StorageService.getNewsletters();

        // 3. Filter for candidates
        const toArchive = newsletters.filter(n => {
            if (n.isArchived) return false; // Already archived
            const received = new Date(n.receivedDate);
            return received < cutoffDate;
        });

        if (toArchive.length === 0) return 0;

        console.log(`Found ${toArchive.length} newsletters to archive.`);

        // 4. Archive them in Gmail and update local storage
        let archivedCount = 0;
        const archivedIds: string[] = [];

        for (const newsletter of toArchive) {
            try {
                // Remove 'INBOX' label
                await GmailClient.modifyMessage(newsletter.id, { removeLabelIds: ['INBOX'] });
                archivedIds.push(newsletter.id);
                archivedCount++;
            } catch (error) {
                console.error(`Failed to archive ${newsletter.id}:`, error);
            }
        }

        // 5. Update local storage status
        if (archivedIds.length > 0) {
            await StorageService.markAsArchived(archivedIds);
        }

        return archivedCount;
    }

    static async archiveNow(id: string): Promise<boolean> {
        try {
            await GmailClient.modifyMessage(id, { removeLabelIds: ['INBOX'] });
            await StorageService.markAsArchived([id]);
            return true;
        } catch (error) {
            console.error(`Failed to archive ${id}:`, error);
            return false;
        }
    }
}
