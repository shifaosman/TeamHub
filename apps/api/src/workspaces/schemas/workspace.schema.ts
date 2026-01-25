import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WorkspaceDocument = HydratedDocument<Workspace>;

@Schema({ timestamps: true })
export class WorkspaceSettings {
  @Prop({ default: true })
  allowPublicChannels!: boolean;

  @Prop({ default: true })
  allowPrivateChannels!: boolean;

  @Prop({ default: true })
  allowDMs!: boolean;

  @Prop({ default: false })
  requireInvite!: boolean;

  @Prop()
  defaultChannelId?: string;
}

@Schema({ timestamps: true })
export class Workspace {
  @Prop({ required: true, index: true })
  organizationId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  slug!: string;

  @Prop()
  description?: string;

  @Prop()
  avatar?: string;

  @Prop({ type: WorkspaceSettings, default: () => ({}) })
  settings!: WorkspaceSettings;

  @Prop({ required: true, index: true })
  createdBy!: string;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);

// Indexes for performance
WorkspaceSchema.index({ organizationId: 1 });
WorkspaceSchema.index({ slug: 1, organizationId: 1 }, { unique: true });
