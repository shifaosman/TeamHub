import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

export type TaskStatus = 'todo' | 'in-progress' | 'done';

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, index: true })
  workspaceId!: string;

  // Task created from a message (optional)
  @Prop({ index: true })
  sourceMessageId?: string;

  @Prop({ index: true })
  sourceChannelId?: string;

  // Stored for convenience/debugging (workspaceId already exists and is required)
  @Prop({ index: true })
  sourceWorkspaceId?: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title!: string;

  @Prop({ maxlength: 2000 })
  description?: string;

  @Prop({ type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo', index: true })
  status!: TaskStatus;

  @Prop({ type: String, default: null, index: true })
  assigneeId?: string | null;

  @Prop({ type: [String], default: [], index: true })
  watcherIds!: string[];

  @Prop({ type: Date, index: true })
  dueAt?: Date;

  // Simple reminder state to avoid repeated notifications
  @Prop()
  reminder24hSentAt?: Date;

  @Prop()
  reminder1hSentAt?: Date;

  @Prop({ required: true, index: true })
  createdBy!: string;

  @Prop({ required: true, index: true })
  order!: number;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// Indexes for performance
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ projectId: 1, order: 1 });
TaskSchema.index({ workspaceId: 1, createdAt: -1 });
TaskSchema.index({ sourceMessageId: 1 });
TaskSchema.index({ sourceChannelId: 1 });
