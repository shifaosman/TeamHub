import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ChannelType } from '@teamhub/shared';

export type ChannelDocument = HydratedDocument<Channel>;

@Schema({ timestamps: true })
export class Channel {
  @Prop({ required: true, index: true })
  workspaceId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ type: String, enum: Object.values(ChannelType), default: ChannelType.PUBLIC })
  type!: ChannelType;

  @Prop()
  description?: string;

  @Prop({ default: false })
  isArchived!: boolean;

  @Prop({ required: true, index: true })
  createdBy!: string;

  @Prop({ type: [String], default: [] })
  memberIds!: string[];
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);

// Indexes for performance
ChannelSchema.index({ workspaceId: 1, type: 1 });
ChannelSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });
ChannelSchema.index({ workspaceId: 1, isArchived: 1 });
