import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NoteCollaboratorDocument = HydratedDocument<NoteCollaborator>;

@Schema({ timestamps: true })
export class NoteCollaborator {
  @Prop({ required: true, index: true })
  noteId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({
    type: String,
    enum: ['read', 'write', 'admin'],
    default: 'read',
  })
  permission!: string;
}

export const NoteCollaboratorSchema = SchemaFactory.createForClass(NoteCollaborator);

// Indexes for performance - composite unique index ensures one permission per user per note
NoteCollaboratorSchema.index({ noteId: 1, userId: 1 }, { unique: true });
NoteCollaboratorSchema.index({ userId: 1 });
