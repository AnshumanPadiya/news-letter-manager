import { GmailClient } from './gmail';

export class UnsubscribeService {
    /**
     * Attempts to unsubscribe from a newsletter using the List-Unsubscribe header.
     * Returns true if an unsubscribe action was successfully initiated.
     */
    static async unsubscribe(messageId: string): Promise<boolean> {
        try {
            const message = await GmailClient.getMessage(messageId);
            const headers = message.payload?.headers;

            if (!headers) return false;

            const unsubscribeHeader = headers.find(h => h.name.toLowerCase() === 'list-unsubscribe');
            if (!unsubscribeHeader || !unsubscribeHeader.value) return false;

            // Header format is usually: <mailto:unsubscribe@example.com>, <https://example.com/unsubscribe>
            const links = unsubscribeHeader.value.split(',').map(s => s.trim().replace(/^<|>$/g, ''));

            // Prefer mailto as it's easier to automate
            const mailtoLink = links.find(l => l.startsWith('mailto:'));
            if (mailtoLink) {
                await this.handleMailto(mailtoLink);
                return true;
            }

            // Fallback to HTTP (we can't click it for them, but we can open it)
            // For now, we'll return false for HTTP links so the UI can tell the user to open the email manually,
            // OR we could open a tab. Let's try to open a tab if it's an extension context.
            const httpLink = links.find(l => l.startsWith('http'));
            if (httpLink) {
                if (chrome.tabs) {
                    chrome.tabs.create({ url: httpLink, active: false });
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Unsubscribe failed:', error);
            return false;
        }
    }

    private static async handleMailto(mailto: string): Promise<void> {
        // Format: mailto:unsubscribe@example.com?subject=unsubscribe
        const url = new URL(mailto);
        const to = url.pathname;
        const subject = url.searchParams.get('subject') || 'Unsubscribe';
        const body = url.searchParams.get('body') || 'Please unsubscribe me from this list.';

        // Construct raw email
        const email = [
            `To: ${to}`,
            `Subject: ${subject}`,
            '',
            body
        ].join('\r\n');

        const utf8Bytes = new TextEncoder().encode(email);
        const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
        const base64Email = btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        await GmailClient.sendEmail(base64Email);
    }
}
