import { Scheduler } from './scheduler';
import { NewsletterProcessor } from '../services/processor';
import { GmailClient } from '../services/gmail';

console.log('Newsletter Manager Background Service Started');

// Initialize Schedule on Install
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed, setting up default schedule (Sunday 9AM)');
    await Scheduler.createSchedule(0, 9); // Default: Sunday 9 AM

    // Note: First run might fail if not authenticated. 
    // Ideally we should prompt user to sign in first.
    // console.log('Triggering First Run immediately...');
    // try {
    //     await runNewsletterJob();
    // } catch (error) {
    //     console.log('First run failed (likely needs auth):', error);
    // }
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
    if (message.action === 'RUN_JOB_NOW') {
        // Pass interactive: true when triggered by user
        runNewsletterJob(true).then(() => sendResponse({ success: true })).catch(err => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open for async response
    }
    if (message.action === 'GET_NEXT_RUN') {
        Scheduler.getNextRun().then(time => sendResponse({ time }));
        return true;
    }
    if (message.action === 'CLEANUP_EMAILS') {
        cleanupEmails().then((count) => sendResponse({ success: true, count })).catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
});

async function runNewsletterJob(interactive: boolean = false) {
    try {
        console.log('Starting Newsletter Job...');

        // 1. Fetch Newsletters
        const newsletters = await NewsletterProcessor.fetchNewsletters(7, interactive);
        console.log(`Found ${newsletters.length} newsletters`);

        if (newsletters.length === 0) {
            console.log('No newsletters found to process.');
            return;
        }

        // 2. Score & Rank
        const scored = await NewsletterProcessor.scoreNewsletters(newsletters);
        const top10 = scored.slice(0, 10);
        console.log('Top 10 selected:', top10.map(n => n.subject));

        // 3. Generate Digest
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

        // 4. Send Email
        await GmailClient.sendEmail(base64Email, interactive);
        console.log('Weekly Digest Sent!');

        // 5. Store for Cleanup (Don't delete yet)
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
