export enum ChannelType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  DM = 'dm',
  GROUP_DM = 'group_dm',
  ANNOUNCEMENT = 'announcement',
}

export interface Channel {
  _id: string;
  workspaceId: string;
  name: string;
  slug: string;
  type: ChannelType;
  description?: string;
  isArchived: boolean;
  createdBy: string;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelMember {
  _id: string;
  channelId: string;
  userId: string;
  lastReadAt?: Date;
  notificationPreference: NotificationPreference;
  joinedAt: Date;
}

export enum NotificationPreference {
  ALL = 'all',
  MENTIONS = 'mentions',
  NONE = 'none',
}
