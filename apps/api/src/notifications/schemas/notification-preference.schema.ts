import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { NotificationPreference } from '@teamhub/shared';

export type NotificationPreferenceDocument = HydratedDocument<NotificationPreferenceModel>;

@Schema({ timestamps: true })
export class NotificationPreferenceModel {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ index: true })
  workspaceId?: string;

  @Prop({ index: true })
  channelId?: string;

  @Prop({
    type: String,
    enum: Object.values(NotificationPreference),
    default: NotificationPreference.ALL,
  })
  preference!: NotificationPreference;

  @Prop({ default: true })
  emailEnabled!: boolean;
}

export const NotificationPreferenceSchema =
  SchemaFactory.createForClass(NotificationPreferenceModel);

// Indexes for performance - composite unique index ensures one preference per user/workspace/channel
NotificationPreferenceSchema.index({ userId: 1, workspaceId: 1, channelId: 1 }, { unique: true });
NotificationPreferenceSchema.index({ userId: 1 });
