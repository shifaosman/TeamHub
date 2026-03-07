import type { ActivityType, ActivityEntityType } from '@/lib/activityApi';

/** Human-readable action verb for activity type */
export function getActivityAction(type: ActivityType): string {
  const map: Record<ActivityType, string> = {
    TASK_CREATED: 'created task',
    TASK_CREATED_FROM_MESSAGE: 'created task from message',
    TASK_MOVED: 'moved task',
    TASK_ASSIGNED: 'assigned task',
    TASK_WATCHERS_UPDATED: 'updated task watchers',
    TASK_DUE_UPDATED: 'updated task due date',
    TASK_UPDATED: 'updated task',
    COMMENT_ADDED: 'commented on task',
    COMMENT_DELETED: 'deleted a comment',
    PROJECT_CREATED: 'created project',
    PROJECT_UPDATED: 'updated project',
    PROJECT_MEMBER_ADDED: 'added member to project',
    PROJECT_MEMBER_ROLE_UPDATED: 'updated project member role',
    PROJECT_DELETED: 'deleted project',
    NOTE_CREATED: 'created note',
    NOTE_EDITED: 'edited note',
    MESSAGE_POSTED: 'posted in channel',
    FILE_UPLOADED: 'uploaded file',
    CHANNEL_CREATED: 'created channel',
    MEMBER_JOINED: 'joined workspace',
  };
  return map[type] ?? type;
}

/** Short entity type label for badges */
export function getEntityTypeLabel(entityType?: ActivityEntityType): string {
  if (!entityType) return 'Activity';
  const map: Record<ActivityEntityType, string> = {
    project: 'Project',
    task: 'Task',
    note: 'Note',
    message: 'Message',
    file: 'File',
    workspace: 'Workspace',
    channel: 'Channel',
  };
  return map[entityType] ?? entityType;
}

/** Primary display name from activity metadata (e.g. task title, note title, file name) */
export function getActivityEntityName(item: {
  type: ActivityType;
  metadata?: Record<string, unknown>;
}): string {
  const m = item.metadata ?? {};
  if (typeof m.title === 'string') return m.title;
  if (typeof m.name === 'string') return m.name;
  if (typeof m.originalName === 'string') return m.originalName;
  if (typeof m.contentPreview === 'string') return m.contentPreview.substring(0, 60) + (m.contentPreview.length > 60 ? '…' : '');
  if (typeof m.channelName === 'string') return m.channelName;
  return 'Item';
}
