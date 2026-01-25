import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { NotificationPreference } from '@teamhub/shared';

export type ChannelMemberDocument = HydratedDocument<ChannelMember>;

@Schema({ timestamps: true })
export class ChannelMember {
  @Prop({ required: true, index: true })
  channelId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop()
  lastReadAt?: Date;

  @Prop({
    type: String,
    enum: Object.values(NotificationPreference),
    default: NotificationPreference.ALL,
  })
  notificationPreference!: NotificationPreference;

  @Prop({ default: Date.now })
  joinedAt!: Date;
}

export const ChannelMemberSchema = SchemaFactory.createForClass(ChannelMember);

// Indexes for performance - composite unique index ensures one membership per user per channel
ChannelMemberSchema.index({ channelId: 1, userId: 1 }, { unique: true });
ChannelMemberSchema.index({ userId: 1 });
ChannelMemberSchema.index({ channelId: 1, lastReadAt: 1 });
