export interface IGmailMessage {
    id: string;
    threadId: string;
    labelIds?: string[];
    snippet?: string;
    payload?: IMessagePart;
    internalDate?: string;
}

export interface IMessagePart {
    partId: string;
    mimeType: string;
    filename: string;
    headers: IHeader[];
    body?: IMessageBody;
    parts?: IMessagePart[];
}

export interface IHeader {
    name: string;
    value: string;
}

export interface IMessageBody {
    size: number;
    data?: string;
}

export interface IListMessagesResponse {
    messages?: IGmailMessage[];
    nextPageToken?: string;
    resultSizeEstimate?: number;
}

export interface IUserProfile {
    emailAddress: string;
    messagesTotal: number;
    threadsTotal: number;
    historyId: string;
}
