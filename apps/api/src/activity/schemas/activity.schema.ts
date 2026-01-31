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
  | 'PROJECT_DELETED';

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

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Indexes for querying feeds
ActivitySchema.index({ workspaceId: 1, createdAt: -1 });
ActivitySchema.index({ projectId: 1, createdAt: -1 });
ActivitySchema.index({ taskId: 1, createdAt: -1 });
