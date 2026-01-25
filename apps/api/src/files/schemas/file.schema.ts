import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FileDocument = HydratedDocument<File>;

@Schema({ timestamps: true })
export class File {
  @Prop({ required: true, index: true })
  workspaceId!: string;

  @Prop({ index: true })
  channelId?: string;

  @Prop({ required: true, index: true })
  uploadedBy!: string;

  @Prop({ required: true })
  filename!: string;

  @Prop({ required: true })
  originalName!: string;

  @Prop({ required: true })
  mimeType!: string;

  @Prop({ required: true })
  size!: number;

  @Prop({ required: true })
  storageKey!: string;

  @Prop({ required: true })
  storageUrl!: string;

  @Prop({ default: false })
  isPublic!: boolean;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const FileSchema = SchemaFactory.createForClass(File);

// Indexes for performance
FileSchema.index({ workspaceId: 1, createdAt: -1 });
FileSchema.index({ channelId: 1, createdAt: -1 });
FileSchema.index({ uploadedBy: 1, createdAt: -1 });
FileSchema.index({ mimeType: 1 });
