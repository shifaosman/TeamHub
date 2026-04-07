export enum NotificationType {
  MESSAGE = 'message',
  MENTION = 'mention',
  REPLY = 'reply',
  REACTION = 'reaction',
  CHANNEL_INVITE = 'channel_invite',
  WORKSPACE_INVITE = 'workspace_invite',
  FILE_SHARED = 'file_shared',
  FILE_COMMENT = 'file_comment',
  TASK_ASSIGNED = 'task_assigned',
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DUE_SOON = 'task_due_soon',
  TASK_APPROVAL_NEEDED = 'task_approval_needed',
  TASK_APPROVED = 'task_approved',
  TASK_REJECTED = 'task_rejected',
  REPORT_SUBMITTED = 'report_submitted',
  MESSAGE_CONVERTED_TO_TASK = 'message_converted_to_task',
  NOTE_UPDATED = 'note_updated',
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
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
