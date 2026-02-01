import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ required: true, index: true })
  taskId!: string;

  @Prop({ required: true, index: true })
  projectId!: string;

  @Prop({ required: true, index: true })
  workspaceId!: string;

  @Prop({ required: true, maxlength: 5000 })
  body!: string;

  @Prop({ required: true, index: true })
  createdBy!: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Indexes for performance
CommentSchema.index({ taskId: 1, createdAt: 1 });
CommentSchema.index({ projectId: 1, createdAt: 1 });
