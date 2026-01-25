import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { MessageEditHistory, MessageEditHistoryDocument } from './schemas/message-edit-history.schema';
import { Bookmark, BookmarkDocument } from './schemas/bookmark.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { SearchMessagesDto } from './dto/search-messages.dto';
import { ChannelsService } from '../channels/channels.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@teamhub/shared';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(MessageEditHistory.name)
    private messageEditHistoryModel: Model<MessageEditHistoryDocument>,
    @InjectModel(Bookmark.name) private bookmarkModel: Model<BookmarkDocument>,
    private channelsService: ChannelsService,
    @Optional() @Inject(forwardRef(() => NotificationsService))
    private notificationsService?: NotificationsService
  ) {}

  async create(userId: string, createMessageDto: CreateMessageDto): Promise<MessageDocument> {
    // Verify channel access
    const channel = await this.channelsService.findOne(createMessageDto.channelId, userId);

    // Validate that message has either content or attachments
    if (!createMessageDto.content?.trim() && (!createMessageDto.attachments || createMessageDto.attachments.length === 0)) {
      throw new BadRequestException('Message must have either content or attachments');
    }

    // Sanitize content to prevent XSS (if provided)
    const sanitizedContent = createMessageDto.content
      ? sanitizeHtml(createMessageDto.content, {
          allowedTags: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre'],
          allowedAttributes: {
            a: ['href', 'title'],
          },
        })
      : '';

    // Extract mentions from content
    const mentions = sanitizedContent ? this.extractMentions(sanitizedContent) : [];

    // If replying to a message, verify it exists
    if (createMessageDto.replyToId) {
      const parentMessage = await this.messageModel.findById(createMessageDto.replyToId).exec();
      if (!parentMessage) {
        throw new NotFoundException('Parent message not found');
      }
      if (parentMessage.channelId !== createMessageDto.channelId) {
        throw new BadRequestException('Reply must be in the same channel');
      }
    }

    const message = new this.messageModel({
      channelId: createMessageDto.channelId,
      workspaceId: channel.workspaceId,
      userId,
      content: sanitizedContent || '',
      threadId: createMessageDto.threadId,
      replyToId: createMessageDto.replyToId,
      mentions,
      attachments: createMessageDto.attachments || [],
    });

    const savedMessage = await message.save();

    // Update last read for sender
    await this.channelsService.updateLastRead(createMessageDto.channelId, userId);

    // Create notifications for channel members (excluding sender)
    if (this.notificationsService) {
      const channelMembers = await this.channelsService.getChannelMembers(
        createMessageDto.channelId
      );
      const memberIds = channelMembers
        .map((m) => {
          // Handle both populated and non-populated userId
          const userIdValue = typeof m.userId === 'object' && m.userId?._id
            ? m.userId._id.toString()
            : m.userId.toString();
          return userIdValue;
        })
        .filter((id) => id !== userId);

      for (const memberId of memberIds) {
        const shouldNotify = await this.notificationsService.shouldNotify(
          memberId,
          channel.workspaceId,
          createMessageDto.channelId,
          mentions.includes(memberId) ? NotificationType.MENTION : NotificationType.MESSAGE
        );

        if (shouldNotify) {
          await this.notificationsService.create({
            userId: memberId,
            workspaceId: channel.workspaceId,
            type: mentions.includes(memberId) ? NotificationType.MENTION : NotificationType.MESSAGE,
            title: mentions.includes(memberId)
              ? `You were mentioned in #${channel.name}`
              : `New message in #${channel.name}`,
            body: sanitizedContent
              ? sanitizedContent.substring(0, 100)
              : createMessageDto.attachments && createMessageDto.attachments.length > 0
                ? `${createMessageDto.attachments.length} file(s) shared`
                : 'New message',
            link: `/channels/${createMessageDto.channelId}`,
            metadata: {
              messageId: savedMessage._id.toString(),
              channelId: createMessageDto.channelId,
            },
          });
        }
      }
    }

    return savedMessage;
  }

  async findAll(
    channelId: string,
    userId: string,
    limit = 50,
    before?: string
  ): Promise<MessageDocument[]> {
    // Verify channel access
    await this.channelsService.findOne(channelId, userId);

    const query: any = {
      channelId,
      deletedAt: null,
    };

    if (before) {
      query._id = { $lt: before };
    }

    const messages = await this.messageModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'username email firstName lastName avatar')
      .exec();

    return messages.reverse(); // Return in chronological order
  }

  async findThreadMessages(threadId: string, userId: string): Promise<MessageDocument[]> {
    const thread = await this.messageModel.findById(threadId).exec();
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Verify channel access
    await this.channelsService.findOne(thread.channelId, userId);

    return this.messageModel
      .find({
        $or: [{ _id: threadId }, { threadId }],
        deletedAt: null,
      })
      .sort({ createdAt: 1 })
      .populate('userId', 'username email firstName lastName avatar')
      .exec();
  }

  async findOne(id: string, userId: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(id).exec();
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Verify channel access
    await this.channelsService.findOne(message.channelId, userId);

    return message;
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateMessageDto
  ): Promise<MessageDocument> {
    const message = await this.findOne(id, userId);

    // Only message author can edit
    if (message.userId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    // Cannot edit deleted messages
    if (message.deletedAt) {
      throw new BadRequestException('Cannot edit deleted messages');
    }

    // Save edit history
    await this.messageEditHistoryModel.create({
      messageId: id,
      content: message.content,
      editedAt: message.editedAt || message.updatedAt,
    });

    // Sanitize new content
    const sanitizedContent = sanitizeHtml(updateDto.content, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre'],
      allowedAttributes: {
        a: ['href', 'title'],
      },
    });

    // Extract mentions
    const mentions = this.extractMentions(sanitizedContent);

    message.content = sanitizedContent;
    message.editedAt = new Date();
    message.mentions = mentions;

    return message.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const message = await this.findOne(id, userId);

    // Only message author can delete (for now)
    if (message.userId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    const canDelete =
      message.userId.toString() === userId ||
      workspaceMember?.role === 'owner' ||
      workspaceMember?.role === 'admin';

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this message');
    }

    // Soft delete
    message.deletedAt = new Date();
    await message.save();
  }

  async addReaction(
    messageId: string,
    userId: string,
    reactionDto: AddReactionDto
  ): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify channel access
    await this.channelsService.findOne(message.channelId, userId);

    const existingReaction = message.reactions.find((r) => r.emoji === reactionDto.emoji);

    if (existingReaction) {
      // Toggle: if user already reacted, remove; otherwise add
      if (existingReaction.userIds.includes(userId)) {
        existingReaction.userIds = existingReaction.userIds.filter((id) => id !== userId);
        if (existingReaction.userIds.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== reactionDto.emoji);
        }
      } else {
        existingReaction.userIds.push(userId);
      }
    } else {
      // Add new reaction
      message.reactions.push({
        emoji: reactionDto.emoji,
        userIds: [userId],
      });
    }

    return message.save();
  }

  async pinMessage(messageId: string, userId: string): Promise<MessageDocument> {
    const message = await this.findOne(messageId, userId);
    message.isPinned = true;
    return message.save();
  }

  async unpinMessage(messageId: string, userId: string): Promise<MessageDocument> {
    const message = await this.findOne(messageId, userId);
    message.isPinned = false;
    return message.save();
  }

  async bookmarkMessage(messageId: string, userId: string): Promise<BookmarkDocument> {
    const message = await this.findOne(messageId, userId);

    // Check if already bookmarked
    const existing = await this.bookmarkModel.findOne({ userId, messageId }).exec();
    if (existing) {
      return existing;
    }

    const bookmark = new this.bookmarkModel({ userId, messageId });
    return bookmark.save();
  }

  async unbookmarkMessage(messageId: string, userId: string): Promise<void> {
    await this.bookmarkModel.deleteOne({ userId, messageId }).exec();
  }

  async getUserBookmarks(userId: string): Promise<MessageDocument[]> {
    const bookmarks = await this.bookmarkModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();

    const messageIds = bookmarks.map((b) => b.messageId);

    if (messageIds.length === 0) {
      return [];
    }

    return this.messageModel
      .find({ _id: { $in: messageIds }, deletedAt: null })
      .populate('userId', 'username email firstName lastName avatar')
      .exec();
  }

  async getPinnedMessages(channelId: string, userId: string): Promise<MessageDocument[]> {
    await this.channelsService.findOne(channelId, userId);

    return this.messageModel
      .find({ channelId, isPinned: true, deletedAt: null })
      .sort({ createdAt: -1 })
      .populate('userId', 'username email firstName lastName avatar')
      .exec();
  }

  async search(searchDto: SearchMessagesDto, userId: string): Promise<MessageDocument[]> {
    // Verify workspace membership - simplified for now
    // In production, inject WorkspacesService properly

    const query: any = {
      workspaceId: searchDto.workspaceId,
      deletedAt: null,
      $text: { $search: searchDto.query },
    };

    if (searchDto.channelId) {
      query.channelId = searchDto.channelId;
    }

    if (searchDto.userId) {
      query.userId = searchDto.userId;
    }

    if (searchDto.hasFile) {
      query.attachments = { $exists: true, $ne: [] };
    }

    if (searchDto.hasLink) {
      query.content = { $regex: /https?:\/\// };
    }

    if (searchDto.dateFrom || searchDto.dateTo) {
      query.createdAt = {};
      if (searchDto.dateFrom) {
        query.createdAt.$gte = new Date(searchDto.dateFrom);
      }
      if (searchDto.dateTo) {
        query.createdAt.$lte = new Date(searchDto.dateTo);
      }
    }

    return this.messageModel
      .find(query)
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .limit(searchDto.limit || 20)
      .skip(searchDto.offset || 0)
      .populate('userId', 'username email firstName lastName avatar')
      .exec();
  }

  async getUnreadCount(channelId: string, userId: string): Promise<number> {
    // This will be implemented with proper channel member access
    // For now, return 0
    return 0;
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)]; // Remove duplicates
  }
}
