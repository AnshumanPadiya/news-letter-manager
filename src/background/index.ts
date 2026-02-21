import { Scheduler } from './scheduler';
import { NewsletterProcessor, GmailClient, StorageService } from '../services';
import { UnsubscribeService } from '../services/unsubscribe';
import { ArchiverService } from '../services/archiver';

console.log('Newsletter Manager Background Service Started');

// Initialize Schedule on Install
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed, setting up default schedule (Sunday 9AM)');
    await Scheduler.createSchedule(0, 9); // Default: Sunday 9 AM
});

// Listen for Alarms
chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    if (alarm.name === Scheduler.ALARM_NAME) {
        console.log('Weekly Alarm Triggered');
        await runNewsletterJob();
    }
});

// Listen for messages from Popup
chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    switch (message.action) {
        case 'RUN_JOB_NOW':
            runNewsletterJob(true)
                .then(() => sendResponse({ success: true }))
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true;

        case 'GET_NEXT_RUN':
            Scheduler.getNextRun().then(time => sendResponse({ time }));
            return true;

        case 'CLEANUP_EMAILS':
            cleanupEmails()
                .then((count) => sendResponse({ success: true, count }))
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true;

        case 'UNSUBSCRIBE':
            UnsubscribeService.unsubscribe(message.id)
                .then(success => sendResponse({ success }))
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true;

        case 'ARCHIVE_NOW':
            ArchiverService.archiveNow(message.id)
                .then(success => sendResponse({ success }))
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true;

        case 'CHECK_ARCHIVE_RULES':
            ArchiverService.checkAndArchive()
                .then(count => sendResponse({ success: true, count }))
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true;

        case 'SEARCH_ARCHIVE':
            StorageService.searchNewsletters(message.query)
                .then(results => sendResponse({ results }))
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true;

        case 'GET_SETTINGS':
            StorageService.getSettings()
                .then(settings => sendResponse({ settings }));
            return true;

        case 'SAVE_SETTINGS':
            StorageService.saveSettings(message.settings)
                .then(() => sendResponse({ success: true }));
            return true;
    }
});

async function runNewsletterJob(interactive: boolean = false) {
    try {
        console.log('Starting Newsletter Job...');

        // 1. Fetch Newsletters
        const newsletters = await NewsletterProcessor.fetchNewsletters(7, 50, interactive);
        console.log(`Found ${newsletters.length} newsletters`);

        if (newsletters.length === 0) {
            console.log('No newsletters found to process.');
            return;
        }

        // 2. Score & Rank
        const scored = await NewsletterProcessor.scoreNewsletters(newsletters);
        const top10 = scored.slice(0, 10);
        console.log('Top 10 selected:', top10.map(n => n.subject));

        // 3. Save to Storage for Dashboard
        const storedNewsletters = top10.map(n => ({
            id: n.message.id,
            subject: n.subject,
            sender: n.sender,
            summary: n.summary,
            category: n.category,
            receivedDate: new Date(parseInt(n.message.internalDate || Date.now().toString())).toISOString(),
            isArchived: false,
            importanceScore: n.score
        }));

        // Import StorageService dynamically if not at top level, or ensure it's imported.
        // Since we are in an async function and it's a module, dynamic import is fine or top level.
        // Let's use dynamic import to match the pattern in message listeners, or just add top level import.
        // Adding top level import is cleaner.
        await StorageService.saveNewsletters(storedNewsletters);
        console.log(`Saved ${storedNewsletters.length} newsletters to storage.`);

        // 4. Generate Digest
        const htmlBody = NewsletterProcessor.generateDigestHTML(top10);
        const userProfile = await GmailClient.getProfile(interactive);

        // Construct Email (MIME)
        const email = [
            `To: ${userProfile.emailAddress}`,
            'Subject: Your Weekly Best Reads',
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            '',
            htmlBody
        ].join('\r\n');

        // Unicode-safe Base64 Encoding
        const utf8Bytes = new TextEncoder().encode(email);
        const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
        const base64Email = btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        // 5. Send Email
        await GmailClient.sendEmail(base64Email, interactive);
        console.log('Weekly Digest Sent!');

        // 6. Store for Cleanup (Don't delete yet)
        const allIds = newsletters.map(n => n.id);
        const storage = await chrome.storage.local.get(['pendingCleanupIds']);
        const existingIds = (storage.pendingCleanupIds as string[]) || [];
        const uniqueIds = [...new Set([...existingIds, ...allIds])];

        await chrome.storage.local.set({ pendingCleanupIds: uniqueIds });
        console.log(`Stored ${allIds.length} emails for cleanup confirmation.`);

    } catch (error) {
        console.error('Job Failed:', error);
        throw error; // Re-throw so UI knows it failed
    }
}

async function cleanupEmails(): Promise<number> {
    const storage = await chrome.storage.local.get(['pendingCleanupIds']);
    const ids = (storage.pendingCleanupIds as string[]) || [];

    if (ids.length === 0) return 0;

    console.log(`Cleaning up ${ids.length} emails...`);

    let deletedCount = 0;
    for (const id of ids) {
        try {
            await GmailClient.trashMessage(id);
            deletedCount++;
        } catch (e) {
            console.error(`Failed to trash ${id}`, e);
        }
    }

    await chrome.storage.local.remove('pendingCleanupIds');
    return deletedCount;
}
