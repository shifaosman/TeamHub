import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ _id: false })
export class MessageReaction {
  @Prop({ required: true })
  emoji!: string;

  @Prop({ type: [String], default: [] })
  userIds!: string[];
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true, index: true })
  channelId!: string;

  @Prop({ required: true, index: true })
  workspaceId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ index: true })
  threadId?: string;

  @Prop()
  replyToId?: string;

  @Prop()
  editedAt?: Date;

  @Prop()
  deletedAt?: Date;

  @Prop({ default: false, index: true })
  isPinned!: boolean;

  @Prop({ type: [MessageReaction], default: [] })
  reactions!: MessageReaction[];

  @Prop({ type: [String], default: [] })
  attachments!: string[];

  @Prop({ type: [String], default: [], index: true })
  mentions!: string[];

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for performance
MessageSchema.index({ channelId: 1, createdAt: -1 });
MessageSchema.index({ threadId: 1, createdAt: -1 });
MessageSchema.index({ workspaceId: 1, createdAt: -1 });
MessageSchema.index({ userId: 1, createdAt: -1 });
MessageSchema.index({ mentions: 1, createdAt: -1 });
MessageSchema.index({ isPinned: 1, channelId: 1 });
// Text search index for message content (compound index for better performance)
MessageSchema.index({ content: 'text', workspaceId: 1 });
