import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NoteVersionDocument = HydratedDocument<NoteVersion>;

@Schema({ timestamps: true })
export class NoteVersion {
  @Prop({ required: true, index: true })
  noteId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, type: String })
  content!: string;

  @Prop({ required: true, index: true })
  createdBy!: string;
}

export const NoteVersionSchema = SchemaFactory.createForClass(NoteVersion);

// Indexes for performance
NoteVersionSchema.index({ noteId: 1, createdAt: -1 });
