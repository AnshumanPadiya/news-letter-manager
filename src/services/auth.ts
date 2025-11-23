export class AuthService {
    static async getAuthToken(interactive: boolean = false): Promise<string> {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive }, (token: any) => {
                if (chrome.runtime.lastError) {
                    console.error('Auth Error:', JSON.stringify(chrome.runtime.lastError));
                    reject(new Error(chrome.runtime.lastError.message || 'Unknown Auth Error'));
                } else if (token) {
                    resolve(token);
                } else {
                    reject(new Error('No token retrieved'));
                }
            });
        });
    }

    static async removeCachedAuthToken(token: string): Promise<void> {
        return new Promise((resolve) => {
            chrome.identity.removeCachedAuthToken({ token }, () => {
                resolve();
            });
        });
    }
}
