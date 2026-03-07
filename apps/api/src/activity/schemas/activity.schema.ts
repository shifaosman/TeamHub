import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ActivityDocument = HydratedDocument<Activity>;

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

/** Entity type for filtering and display (project, task, note, message, file, workspace, channel) */
export type ActivityEntityType =
  | 'project'
  | 'task'
  | 'note'
  | 'message'
  | 'file'
  | 'workspace'
  | 'channel';

@Schema({ timestamps: true })
export class Activity {
  @Prop({ required: true, index: true })
  workspaceId!: string;

  @Prop({ index: true })
  projectId?: string;

  @Prop({ index: true })
  taskId?: string;

  @Prop({ required: true, index: true })
  actorId!: string;

  @Prop({ type: String, required: true, index: true })
  type!: ActivityType;

  /** Entity type for filtering (project, task, note, message, file, workspace, channel) */
  @Prop({ type: String, index: true })
  entityType?: ActivityEntityType;

  /** ID of the primary entity (task, note, channel, etc.) */
  @Prop({ index: true })
  entityId?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Indexes for querying feeds
ActivitySchema.index({ workspaceId: 1, createdAt: -1 });
ActivitySchema.index({ workspaceId: 1, entityType: 1, createdAt: -1 });
ActivitySchema.index({ projectId: 1, createdAt: -1 });
ActivitySchema.index({ taskId: 1, createdAt: -1 });
