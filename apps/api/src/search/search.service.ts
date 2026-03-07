import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../messages/schemas/message.schema';
import { Channel, ChannelDocument } from '../channels/schemas/channel.schema';
import { Note, NoteDocument } from '../notes/schemas/note.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { File, FileDocument } from '../files/schemas/file.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { SearchMessagesDto } from '../messages/dto/search-messages.dto';

export interface SearchResult {
  messages: MessageDocument[];
  channels: ChannelDocument[];
  users: any[];
  notes?: NoteDocument[];
  tasks?: TaskDocument[];
  files?: FileDocument[];
  projects?: ProjectDocument[];
  total: number;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
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

  async searchNotes(workspaceId: string, userId: string, query: string, limit = 5): Promise<NoteDocument[]> {
    await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!query || !query.trim()) return [];
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return this.noteModel
      .find({
        workspaceId,
        isArchived: false,
        $or: [{ title: searchRegex }, { content: searchRegex }],
      })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec() as Promise<NoteDocument[]>;
  }

  async searchTasks(workspaceId: string, userId: string, query: string, limit = 5): Promise<TaskDocument[]> {
    await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!query || !query.trim()) return [];
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return this.taskModel
      .find({
        workspaceId,
        $or: [{ title: searchRegex }, { description: searchRegex }],
      })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec() as Promise<TaskDocument[]>;
  }

  async searchFiles(workspaceId: string, userId: string, query: string, limit = 5): Promise<FileDocument[]> {
    await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!query || !query.trim()) return [];
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return this.fileModel
      .find({
        workspaceId,
        $or: [{ originalName: searchRegex }, { filename: searchRegex }],
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec() as Promise<FileDocument[]>;
  }

  async searchProjects(workspaceId: string, userId: string, query: string, limit = 5): Promise<ProjectDocument[]> {
    await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!query || !query.trim()) return [];
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return this.projectModel
      .find({
        workspaceId,
        $or: [{ name: searchRegex }, { description: searchRegex }],
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean()
      .exec() as Promise<ProjectDocument[]>;
  }

  async globalSearch(
    workspaceId: string,
    userId: string,
    query: string,
    limit = 20
  ): Promise<SearchResult> {
    const workspaceMember = await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const perCategory = Math.max(5, Math.floor(limit / 6));
    const [messages, channels, users, notes, tasks, files, projects] = await Promise.all([
      query.trim()
        ? this.searchMessages(
            { workspaceId, query, limit: perCategory } as SearchMessagesDto,
            userId
          )
        : [],
      this.searchChannels(workspaceId, userId, query),
      this.searchUsers(workspaceId, userId, query),
      this.searchNotes(workspaceId, userId, query, perCategory),
      this.searchTasks(workspaceId, userId, query, perCategory),
      this.searchFiles(workspaceId, userId, query, perCategory),
      this.searchProjects(workspaceId, userId, query, perCategory),
    ]);

    return {
      messages,
      channels,
      users,
      notes,
      tasks,
      files,
      projects,
      total:
        messages.length +
        channels.length +
        users.length +
        (notes?.length ?? 0) +
        (tasks?.length ?? 0) +
        (files?.length ?? 0) +
        (projects?.length ?? 0),
    };
  }
}
