export enum NotificationType {
  MESSAGE = 'message',
  MENTION = 'mention',
  REPLY = 'reply',
  REACTION = 'reaction',
  CHANNEL_INVITE = 'channel_invite',
  WORKSPACE_INVITE = 'workspace_invite',
  FILE_SHARED = 'file_shared',
  TASK_ASSIGNED = 'task_assigned',
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DUE_SOON = 'task_due_soon',
}

export interface Notification {
  _id: string;
  userId: string;
  workspaceId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
