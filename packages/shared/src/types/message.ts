export interface Message {
  _id: string;
  channelId: string;
  workspaceId: string;
  userId: string;
  content: string;
  threadId?: string;
  replyToId?: string;
  editedAt?: Date;
  deletedAt?: Date;
  isPinned: boolean;
  reactions: MessageReaction[];
  attachments: string[];
  mentions: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface MessageEditHistory {
  _id: string;
  messageId: string;
  content: string;
  editedAt: Date;
}

export interface Bookmark {
  _id: string;
  userId: string;
  messageId: string;
  createdAt: Date;
}

export interface ReadReceipt {
  _id: string;
  messageId: string;
  userId: string;
  readAt: Date;
}

export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export interface TypingIndicator {
  channelId: string;
  threadId?: string;
  userId: string;
  username: string;
}
