import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NoteCommentDocument = HydratedDocument<NoteComment>;

@Schema({ timestamps: true })
export class NoteComment {
  @Prop({ required: true, index: true })
  noteId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ index: true })
  parentId?: string;
}

export const NoteCommentSchema = SchemaFactory.createForClass(NoteComment);

// Indexes for performance
NoteCommentSchema.index({ noteId: 1, createdAt: -1 });
NoteCommentSchema.index({ parentId: 1 });
