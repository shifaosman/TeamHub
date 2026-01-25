import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../messages/schemas/message.schema';
import { Channel, ChannelDocument } from '../channels/schemas/channel.schema';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { SearchMessagesDto } from '../messages/dto/search-messages.dto';

export interface SearchResult {
  messages: MessageDocument[];
  channels: ChannelDocument[];
  users: any[];
  total: number;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
    private workspacesService: WorkspacesService
  ) {}

  async searchMessages(searchDto: SearchMessagesDto, userId: string): Promise<MessageDocument[]> {
    // Verify workspace membership
    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      searchDto.workspaceId,
      userId
    );
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Build aggregation pipeline for efficient search
    const pipeline: any[] = [
      {
        $match: {
          workspaceId: searchDto.workspaceId,
          deletedAt: null,
        },
      },
    ];

    // Add text search if query provided
    if (searchDto.query && searchDto.query.trim()) {
      pipeline.push({
        $match: {
          $text: { $search: searchDto.query },
        },
      });
    } else {
      // If no text search, match all messages in workspace
      pipeline.push({
        $match: {},
      });
    }

    // Filter by channel if specified
    if (searchDto.channelId) {
      pipeline.push({
        $match: {
          channelId: searchDto.channelId,
        },
      });
    }

    // Filter by user if specified
    if (searchDto.userId) {
      pipeline.push({
        $match: {
          userId: searchDto.userId,
        },
      });
    }

    // Filter by date range
    if (searchDto.dateFrom || searchDto.dateTo) {
      const dateFilter: any = {};
      if (searchDto.dateFrom) {
        dateFilter.$gte = new Date(searchDto.dateFrom);
      }
      if (searchDto.dateTo) {
        dateFilter.$lte = new Date(searchDto.dateTo);
      }
      pipeline.push({
        $match: {
          createdAt: dateFilter,
        },
      });
    }

    // Filter by has file
    if (searchDto.hasFile) {
      pipeline.push({
        $match: {
          attachments: { $exists: true, $ne: [] },
        },
      });
    }

    // Filter by has link
    if (searchDto.hasLink) {
      pipeline.push({
        $match: {
          content: { $regex: /https?:\/\// },
        },
      });
    }

    // Add text score for relevance sorting
    if (searchDto.query && searchDto.query.trim()) {
      pipeline.push({
        $addFields: {
          score: { $meta: 'textScore' },
        },
      });
    }

    // Sort by relevance (text score) or date
    if (searchDto.query && searchDto.query.trim()) {
      pipeline.push({
        $sort: { score: { $meta: 'textScore' }, createdAt: -1 },
      });
    } else {
      pipeline.push({
        $sort: { createdAt: -1 },
      });
    }

    // Pagination
    pipeline.push({
      $skip: searchDto.offset || 0,
    });
    pipeline.push({
      $limit: searchDto.limit || 20,
    });

    // Populate user information
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    });
    pipeline.push({
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true,
      },
    });
    pipeline.push({
      $project: {
        'user.password': 0,
        'user.refreshToken': 0,
      },
    });

    const messages = await this.messageModel.aggregate(pipeline).exec();
    return messages;
  }

  async searchChannels(
    workspaceId: string,
    userId: string,
    query: string
  ): Promise<ChannelDocument[]> {
    // Verify workspace membership
    const workspaceMember = await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const searchRegex = new RegExp(query, 'i');
    const channels = await this.channelModel
      .find({
        workspaceId,
        isArchived: false,
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { slug: searchRegex },
        ],
      })
      .limit(10)
      .exec();

    return channels;
  }

  async searchUsers(
    workspaceId: string,
    userId: string,
    query: string
  ): Promise<any[]> {
    // Verify workspace membership
    const workspaceMember = await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Get workspace members
    const workspaceMembers = await this.workspacesService.getWorkspaceMembers(workspaceId);
    const searchRegex = new RegExp(query, 'i');

    const matchingUsers = workspaceMembers
      .filter((member: any) => {
        // Handle both populated and non-populated userId
        const user = member.userId;
        if (!user) return false;
        
        const userIdObj = typeof user === 'object' && user._id ? user : { _id: user };
        const userData = typeof user === 'object' && user.username ? user : null;
        
        if (!userData) return false;
        
        return (
          userData.username?.match(searchRegex) ||
          userData.email?.match(searchRegex) ||
          userData.firstName?.match(searchRegex) ||
          userData.lastName?.match(searchRegex)
        );
      })
      .map((member: any) => {
        const user = member.userId;
        const userData = typeof user === 'object' && user.username ? user : null;
        const userIdValue = typeof user === 'object' && user._id ? user._id : user;
        
        return {
          _id: userIdValue.toString(),
          username: userData?.username || 'Unknown',
          email: userData?.email || '',
          firstName: userData?.firstName,
          lastName: userData?.lastName,
          avatar: userData?.avatar,
          role: member.role,
        };
      })
      .slice(0, 10);

    return matchingUsers;
  }

  async globalSearch(
    workspaceId: string,
    userId: string,
    query: string,
    limit = 20
  ): Promise<SearchResult> {
    // Verify workspace membership
    const workspaceMember = await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Search messages
    const messages = await this.searchMessages(
      {
        workspaceId,
        query,
        limit: Math.floor(limit * 0.6), // 60% messages
      } as SearchMessagesDto,
      userId
    );

    // Search channels
    const channels = await this.searchChannels(workspaceId, userId, query);

    // Search users
    const users = await this.searchUsers(workspaceId, userId, query);

    return {
      messages,
      channels,
      users,
      total: messages.length + channels.length + users.length,
    };
  }
}
