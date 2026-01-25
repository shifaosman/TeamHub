import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NoteDocument = HydratedDocument<Note>;

@Schema({ timestamps: true })
export class Note {
  @Prop({ required: true, index: true })
  workspaceId!: string;

  @Prop({ index: true })
  parentId?: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, type: String })
  content!: string;

  @Prop({ required: true, index: true })
  createdBy!: string;

  @Prop({ required: true, index: true })
  updatedBy!: string;

  @Prop({ default: false, index: true })
  isArchived!: boolean;
}

export const NoteSchema = SchemaFactory.createForClass(Note);

// Indexes for performance
NoteSchema.index({ workspaceId: 1, parentId: 1 });
NoteSchema.index({ workspaceId: 1, isArchived: 1, createdAt: -1 });
NoteSchema.index({ createdBy: 1, createdAt: -1 });
// Text search index
NoteSchema.index({ title: 'text', content: 'text' });
