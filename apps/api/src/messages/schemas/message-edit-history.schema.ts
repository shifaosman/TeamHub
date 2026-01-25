import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageEditHistoryDocument = HydratedDocument<MessageEditHistory>;

@Schema({ timestamps: true })
export class MessageEditHistory {
  @Prop({ required: true, index: true })
  messageId!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true })
  editedAt!: Date;
}

export const MessageEditHistorySchema = SchemaFactory.createForClass(MessageEditHistory);

// Indexes for performance
MessageEditHistorySchema.index({ messageId: 1, editedAt: -1 });
