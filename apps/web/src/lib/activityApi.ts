import { api } from '@/lib/api';

export type ActivityType =
  | 'TASK_CREATED'
  | 'TASK_CREATED_FROM_MESSAGE'
  | 'TASK_MOVED'
  | 'TASK_ASSIGNED'
  | 'TASK_WATCHERS_UPDATED'
  | 'TASK_DUE_UPDATED'
  | 'TASK_UPDATED'
  | 'COMMENT_ADDED'
  | 'COMMENT_DELETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_MEMBER_ADDED'
  | 'PROJECT_MEMBER_ROLE_UPDATED'
  | 'PROJECT_DELETED'
  | 'NOTE_CREATED'
  | 'NOTE_EDITED'
  | 'MESSAGE_POSTED'
  | 'FILE_UPLOADED'
  | 'CHANNEL_CREATED'
  | 'MEMBER_JOINED';

export type ActivityEntityType =
  | 'project'
  | 'task'
  | 'note'
  | 'message'
  | 'file'
  | 'workspace'
  | 'channel';

export interface ActivityActor {
  _id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface ActivityItem {
  _id: string;
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  actorId: string;
  actor?: ActivityActor;
  type: ActivityType;
  entityType?: ActivityEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export const activityApi = {
  async list(params: {
    workspaceId?: string;
    projectId?: string;
    taskId?: string;
    entityType?: ActivityEntityType;
    limit?: number;
    offset?: number;
  }): Promise<ActivityItem[]> {
    const search = new URLSearchParams();
    if (params.workspaceId) search.append('workspaceId', params.workspaceId);
    if (params.projectId) search.append('projectId', params.projectId);
    if (params.taskId) search.append('taskId', params.taskId);
    if (params.entityType) search.append('entityType', params.entityType);
    if (params.limit !== undefined) search.append('limit', String(params.limit));
    if (params.offset !== undefined) search.append('offset', String(params.offset));
    const response = await api.get(`/activity?${search.toString()}`);
    return response.data;
  },
};

