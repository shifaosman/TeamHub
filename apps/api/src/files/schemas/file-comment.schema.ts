import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FileCommentDocument = HydratedDocument<FileComment>;

@Schema({ timestamps: true })
export class FileComment {
  @Prop({ required: true, type: Types.ObjectId, ref: 'File', index: true })
  fileId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  content!: string;
}

export const FileCommentSchema = SchemaFactory.createForClass(FileComment);

FileCommentSchema.index({ fileId: 1, createdAt: 1 });
