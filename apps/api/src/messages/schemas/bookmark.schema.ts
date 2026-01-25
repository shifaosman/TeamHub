import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookmarkDocument = HydratedDocument<Bookmark>;

@Schema({ timestamps: true })
export class Bookmark {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, index: true })
  messageId!: string;
}

export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);

// Indexes for performance - composite unique index ensures one bookmark per user per message
BookmarkSchema.index({ userId: 1, messageId: 1 }, { unique: true });
BookmarkSchema.index({ userId: 1, createdAt: -1 });
