import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import {
  NotificationPreferenceModel,
  NotificationPreferenceDocument,
} from './schemas/notification-preference.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { NotificationType, NotificationPreference } from '@teamhub/shared';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationPreferenceModel.name)
    private preferenceModel: Model<NotificationPreferenceDocument>,
    @InjectQueue('notifications') private notificationsQueue: Queue
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<NotificationDocument> {
    const notification = new this.notificationModel(createNotificationDto);
    const saved = await notification.save();

    // Check user preferences
    const preference = await this.getUserPreference(
      createNotificationDto.userId,
      createNotificationDto.workspaceId
    );

    // Queue email notification if enabled
    if (preference.emailEnabled) {
      await this.notificationsQueue.add('send-email', {
        userId: createNotificationDto.userId,
        notificationId: saved._id.toString(),
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        body: createNotificationDto.body,
        link: createNotificationDto.link,
      });
    }

    return saved;
  }

  async createForUsers(
    userIds: string[],
    workspaceId: string,
    type: NotificationType,
    title: string,
    body: string,
    link?: string,
    metadata?: Record<string, unknown>
  ): Promise<NotificationDocument[]> {
    const notifications = userIds.map((userId) => ({
      userId,
      workspaceId,
      type,
      title,
      body,
      link,
      metadata,
    }));

    const created = await this.notificationModel.insertMany(notifications);

    // Queue email notifications for users who have it enabled
    for (const notification of created) {
      const preference = await this.getUserPreference(notification.userId, workspaceId);
      if (preference.emailEnabled) {
        await this.notificationsQueue.add('send-email', {
          userId: notification.userId,
          notificationId: notification._id.toString(),
          type,
          title,
          body,
          link,
        });
      }
    }

    return created;
  }

  async findAll(
    userId: string,
    workspaceId?: string,
    limit = 50,
    offset = 0
  ): Promise<{ notifications: NotificationDocument[]; total: number }> {
    const query: any = { userId };
    if (workspaceId) {
      query.workspaceId = workspaceId;
    }

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .exec(),
      this.notificationModel.countDocuments(query).exec(),
    ]);

    return { notifications, total };
  }

  async findUnreadCount(userId: string, workspaceId?: string): Promise<number> {
    const query: any = { userId, isRead: false };
    if (workspaceId) {
      query.workspaceId = workspaceId;
    }
    return this.notificationModel.countDocuments(query).exec();
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel
      .findOne({ _id: notificationId, userId })
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return notification.save();
  }

  async markAllAsRead(userId: string, workspaceId?: string): Promise<void> {
    const query: any = { userId, isRead: false };
    if (workspaceId) {
      query.workspaceId = workspaceId;
    }

    await this.notificationModel.updateMany(query, { isRead: true }).exec();
  }

  async getUserPreference(
    userId: string,
    workspaceId?: string,
    channelId?: string
  ): Promise<NotificationPreferenceDocument> {
    const query: any = { userId };
    if (workspaceId) {
      query.workspaceId = workspaceId;
    }
    if (channelId) {
      query.channelId = channelId;
    }

    let preference = await this.preferenceModel.findOne(query).exec();

    if (!preference) {
      // Create default preference
      preference = new this.preferenceModel({
        userId,
        workspaceId,
        channelId,
        preference: NotificationPreference.ALL,
        emailEnabled: true,
      });
      await preference.save();
    }

    return preference;
  }

  async updatePreference(
    userId: string,
    updateDto: UpdateNotificationPreferenceDto,
    workspaceId?: string,
    channelId?: string
  ): Promise<NotificationPreferenceDocument> {
    const query: any = { userId };
    if (workspaceId) {
      query.workspaceId = workspaceId;
    }
    if (channelId) {
      query.channelId = channelId;
    }

    const preference = await this.preferenceModel.findOneAndUpdate(
      query,
      updateDto,
      { upsert: true, new: true }
    ).exec();

    return preference;
  }

  async shouldNotify(
    userId: string,
    workspaceId: string,
    channelId: string,
    type: NotificationType
  ): Promise<boolean> {
    // Get channel preference first, then workspace, then global
    const channelPreference = await this.getUserPreference(userId, workspaceId, channelId);
    if (channelPreference.channelId) {
      return this.checkPreference(channelPreference.preference, type);
    }

    const workspacePreference = await this.getUserPreference(userId, workspaceId);
    return this.checkPreference(workspacePreference.preference, type);
  }

  private checkPreference(preference: NotificationPreference, type: NotificationType): boolean {
    if (preference === NotificationPreference.ALL) {
      return true;
    }
    if (preference === NotificationPreference.MENTIONS) {
      return type === NotificationType.MENTION;
    }
    if (preference === NotificationPreference.NONE) {
      return false;
    }
    return true;
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.deleteOne({ _id: notificationId, userId }).exec();
  }
}
