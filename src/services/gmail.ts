import { AuthService } from './auth';
import type { IGmailMessage, IListMessagesResponse, IUserProfile } from '../types/gmail';

const BASE_URL = 'https://gmail.googleapis.com/gmail/v1/users/me';

export class GmailClient {
    private static async fetchWithAuth(url: string, options: RequestInit = {}, interactive: boolean = false): Promise<Response> {
        try {
            const token = await AuthService.getAuthToken(interactive);
            const headers = {
                ...options.headers,
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            };

            let response = await fetch(url, { ...options, headers });

            if (response.status === 401) {
                // Token might be expired, remove it and retry once
                await AuthService.removeCachedAuthToken(token);
                const newToken = await AuthService.getAuthToken(true);
                const newHeaders = {
                    ...options.headers,
                    Authorization: `Bearer ${newToken}`,
                    'Content-Type': 'application/json',
                };
                response = await fetch(url, { ...options, headers: newHeaders });
            }

            if (!response.ok) {
                throw new Error(`Gmail API Error: ${response.status} ${response.statusText}`);
            }

            return response;
        } catch (error) {
            console.error('Fetch with auth failed:', error);
            throw error;
        }
    }

    static async getProfile(interactive: boolean = false): Promise<IUserProfile> {
        const response = await this.fetchWithAuth(`${BASE_URL}/profile`, {}, interactive);
        return response.json();
    }

    static async listMessages(query: string, maxResults: number = 10, pageToken?: string, interactive: boolean = false): Promise<IListMessagesResponse> {
        const params = new URLSearchParams({ q: query, maxResults: maxResults.toString() });
        if (pageToken) params.append('pageToken', pageToken);

        const response = await this.fetchWithAuth(`${BASE_URL}/messages?${params.toString()}`, {}, interactive);
        return response.json();
    }

    static async getMessage(id: string, interactive: boolean = false): Promise<IGmailMessage> {
        const response = await this.fetchWithAuth(`${BASE_URL}/messages/${id}`, {}, interactive);
        return response.json();
    }

    static async trashMessage(id: string, interactive: boolean = false): Promise<void> {
        await this.fetchWithAuth(`${BASE_URL}/messages/${id}/trash`, { method: 'POST' }, interactive);
    }

    static async sendEmail(base64EncodedEmail: string, interactive: boolean = false): Promise<void> {
        await this.fetchWithAuth(`${BASE_URL}/messages/send`, {
            method: 'POST',
            body: JSON.stringify({ raw: base64EncodedEmail }),
        }, interactive);
    }
}
