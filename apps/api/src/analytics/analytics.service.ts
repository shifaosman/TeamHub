import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Channel, ChannelDocument } from '../channels/schemas/channel.schema';
import { Message, MessageDocument } from '../messages/schemas/message.schema';
import { Note, NoteDocument } from '../notes/schemas/note.schema';
import { File, FileDocument } from '../files/schemas/file.schema';
import { WorkspaceMember, WorkspaceMemberDocument } from '../workspaces/schemas/workspace-member.schema';
import { Activity, ActivityDocument } from '../activity/schemas/activity.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

export type AnalyticsPeriod = '7d' | '30d' | '90d';

export interface OverviewStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  activeChannels: number;
  totalNotes: number;
  totalFiles: number;
  totalMembers: number;
}

export interface TimeSeriesPoint {
  date: string; // YYYY-MM-DD
  count: number;
  label?: string;
}

export interface TaskAnalytics {
  createdOverTime: TimeSeriesPoint[];
  completedOverTime: TimeSeriesPoint[];
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  overdueCount: number;
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
}

export interface ProjectAnalytics {
  projects: ProjectProgress[];
  totalProjects: number;
}

export interface ChannelActivity {
  channelId: string;
  channelName: string;
  messageCount: number;
}

export interface UserActivity {
  userId: string;
  username?: string;
  activityCount: number;
}

export interface CollaborationAnalytics {
  mostActiveChannels: ChannelActivity[];
  mostActiveUsers: UserActivity[];
  messagesOverTime: TimeSeriesPoint[];
  notesEditedOverTime: TimeSeriesPoint[];
  filesUploadedOverTime: TimeSeriesPoint[];
}

export interface WorkspaceAnalytics {
  overview: OverviewStats;
  taskAnalytics: TaskAnalytics;
  projectAnalytics: ProjectAnalytics;
  collaborationAnalytics: CollaborationAnalytics;
  period: AnalyticsPeriod;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    @InjectModel(WorkspaceMember.name) private workspaceMemberModel: Model<WorkspaceMemberDocument>,
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private workspacesService: WorkspacesService,
  ) {}

  private async ensureAccess(workspaceId: string, userId: string): Promise<void> {
    const member = await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }
  }

  private getDateRange(period: AnalyticsPeriod): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    switch (period) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }
    return { start, end };
  }

  async getWorkspaceAnalytics(
    workspaceId: string,
    userId: string,
    period: AnalyticsPeriod = '30d',
  ): Promise<WorkspaceAnalytics> {
    await this.ensureAccess(workspaceId, userId);
    const [overview, taskAnalytics, projectAnalytics, collaborationAnalytics] = await Promise.all([
      this.getOverview(workspaceId),
      this.getTaskAnalytics(workspaceId, period),
      this.getProjectAnalytics(workspaceId),
      this.getCollaborationAnalytics(workspaceId, period),
    ]);
    return {
      overview,
      taskAnalytics,
      projectAnalytics,
      collaborationAnalytics,
      period,
    };
  }

  async getOverview(workspaceId: string): Promise<OverviewStats> {
    const [totalProjects, totalTasks, completedTasks, activeChannels, totalNotes, totalFiles, totalMembers] =
      await Promise.all([
        this.projectModel.countDocuments({ workspaceId }).exec(),
        this.taskModel.countDocuments({ workspaceId }).exec(),
        this.taskModel.countDocuments({ workspaceId, status: 'done' }).exec(),
        this.channelModel.countDocuments({ workspaceId, isArchived: false }).exec(),
        this.noteModel.countDocuments({ workspaceId, isArchived: false }).exec(),
        this.fileModel.countDocuments({ workspaceId }).exec(),
        this.workspaceMemberModel.countDocuments({ workspaceId }).exec(),
      ]);

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      activeChannels,
      totalNotes,
      totalFiles,
      totalMembers,
    };
  }

  async getTaskAnalytics(workspaceId: string, period: AnalyticsPeriod): Promise<TaskAnalytics> {
    const { start, end } = this.getDateRange(period);

    const [createdOverTime, completedOverTime, byStatus, byPriority, overdueCount] = await Promise.all([
      this.getTasksCreatedOverTime(workspaceId, start, end),
      this.getTasksCompletedOverTime(workspaceId, start, end),
      this.taskModel
        .aggregate<{ _id: string; count: number }>([
          { $match: { workspaceId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .exec()
        .then((rows) => rows.map((r) => ({ status: r._id, count: r.count }))),
      this.taskModel
        .aggregate<{ _id: string | null; count: number }>([
          { $match: { workspaceId } },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .exec()
        .then((rows) => rows.map((r) => ({ priority: r._id ?? 'medium', count: r.count }))),
      this.taskModel.countDocuments({ workspaceId, status: { $ne: 'done' }, dueAt: { $lt: new Date(), $ne: null } }).exec(),
    ]);

    return {
      createdOverTime,
      completedOverTime,
      byStatus,
      byPriority,
      overdueCount,
    };
  }

  private async getTasksCreatedOverTime(
    workspaceId: string,
    start: Date,
    end: Date,
  ): Promise<TimeSeriesPoint[]> {
    const buckets = await this.taskModel
      .aggregate<{ _id: string; count: number }>([
        { $match: { workspaceId, createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();
    return this.fillTimeSeries(buckets, start, end, (b) => ({ date: b._id, count: b.count }));
  }

  private async getTasksCompletedOverTime(
    workspaceId: string,
    start: Date,
    end: Date,
  ): Promise<TimeSeriesPoint[]> {
    const buckets = await this.activityModel
      .aggregate<{ _id: string; count: number }>([
        {
          $match: {
            workspaceId,
            type: 'TASK_MOVED',
            'metadata.status': 'done',
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();
    return this.fillTimeSeries(buckets, start, end, (b) => ({ date: b._id, count: b.count }));
  }

  private fillTimeSeries<T extends { _id: string }>(
    buckets: T[],
    start: Date,
    end: Date,
    map: (b: T) => TimeSeriesPoint,
  ): TimeSeriesPoint[] {
    const byDate = new Map(buckets.map((b) => [b._id, map(b)]));
    const result: TimeSeriesPoint[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endTime = new Date(end);
    endTime.setHours(23, 59, 59, 999);
    while (current <= endTime) {
      const key = current.toISOString().slice(0, 10);
      result.push(byDate.get(key) ?? { date: key, count: 0 });
      current.setDate(current.getDate() + 1);
    }
    return result;
  }

  async getProjectAnalytics(workspaceId: string): Promise<ProjectAnalytics> {
    const taskCounts = await this.taskModel
      .aggregate<{ _id: string; total: number; done: number }>([
        { $match: { workspaceId } },
        {
          $group: {
            _id: '$projectId',
            total: { $sum: 1 },
            done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          },
        },
      ])
      .exec();

    const projectIds = taskCounts.map((t) => t._id);
    const projects = await this.projectModel
      .find({ _id: { $in: projectIds }, workspaceId })
      .select('name')
      .lean()
      .exec();

    const projectByName = new Map(projects.map((p) => [p._id.toString(), p.name]));
    const byProject = new Map(taskCounts.map((t) => [t._id, t]));

    const projectsList: ProjectProgress[] = taskCounts.map((tc) => ({
      projectId: tc._id,
      projectName: projectByName.get(tc._id) ?? 'Unknown',
      totalTasks: tc.total,
      completedTasks: tc.done,
      progressPercent: tc.total > 0 ? Math.round((tc.done / tc.total) * 100) : 0,
    }));

    return {
      projects: projectsList.sort((a, b) => b.progressPercent - a.progressPercent),
      totalProjects: projectsList.length,
    };
  }

  async getCollaborationAnalytics(
    workspaceId: string,
    period: AnalyticsPeriod,
  ): Promise<CollaborationAnalytics> {
    const { start, end } = this.getDateRange(period);

    const [mostActiveChannels, mostActiveUsers, messagesOverTime, notesEditedOverTime, filesUploadedOverTime] =
      await Promise.all([
        this.getMostActiveChannels(workspaceId, start, end),
        this.getMostActiveUsers(workspaceId, start, end),
        this.getMessagesOverTime(workspaceId, start, end),
        this.getNotesEditedOverTime(workspaceId, start, end),
        this.getFilesUploadedOverTime(workspaceId, start, end),
      ]);

    return {
      mostActiveChannels,
      mostActiveUsers,
      messagesOverTime,
      notesEditedOverTime,
      filesUploadedOverTime,
    };
  }

  private async getMostActiveChannels(
    workspaceId: string,
    start: Date,
    end: Date,
  ): Promise<ChannelActivity[]> {
    const channelCounts = await this.messageModel
      .aggregate<{ _id: string; count: number }>([
        { $match: { workspaceId, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$channelId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .exec();

    if (channelCounts.length === 0) return [];
    const channels = await this.channelModel
      .find({ _id: { $in: channelCounts.map((c) => c._id) }, workspaceId })
      .select('name')
      .lean()
      .exec();
    const nameById = new Map(channels.map((c) => [c._id.toString(), c.name]));
    return channelCounts.map((c) => ({
      channelId: c._id,
      channelName: nameById.get(c._id) ?? 'Unknown',
      messageCount: c.count,
    }));
  }

  private async getMostActiveUsers(
    workspaceId: string,
    start: Date,
    end: Date,
  ): Promise<UserActivity[]> {
    const userCounts = await this.activityModel
      .aggregate<{ _id: string; count: number }>([
        { $match: { workspaceId, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$actorId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .exec();

    if (userCounts.length === 0) return [];
    const { default: mongoose } = await import('mongoose');
    const objectIds: unknown[] = [];
    for (const u of userCounts) {
      try {
        objectIds.push(new mongoose.Types.ObjectId(u._id));
      } catch {
        // skip invalid id
      }
    }
    const users = await this.userModel
      .find({ _id: { $in: objectIds } })
      .select('username')
      .lean()
      .exec();
    const userMap = new Map(users.map((u) => [u._id.toString(), u.username]));
    return userCounts.map((u) => ({
      userId: u._id,
      username: userMap.get(u._id),
      activityCount: u.count,
    }));
  }

  private async getMessagesOverTime(
    workspaceId: string,
    start: Date,
    end: Date,
  ): Promise<TimeSeriesPoint[]> {
    const buckets = await this.messageModel
      .aggregate<{ _id: string; count: number }>([
        { $match: { workspaceId, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .exec();
    return this.fillTimeSeries(buckets, start, end, (b) => ({ date: b._id, count: b.count }));
  }

  private async getNotesEditedOverTime(
    workspaceId: string,
    start: Date,
    end: Date,
  ): Promise<TimeSeriesPoint[]> {
    const buckets = await this.activityModel
      .aggregate<{ _id: string; count: number }>([
        {
          $match: {
            workspaceId,
            type: { $in: ['NOTE_CREATED', 'NOTE_EDITED'] },
            createdAt: { $gte: start, $lte: end },
          },
        },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .exec();
    return this.fillTimeSeries(buckets, start, end, (b) => ({ date: b._id, count: b.count }));
  }

  private async getFilesUploadedOverTime(
    workspaceId: string,
    start: Date,
    end: Date,
  ): Promise<TimeSeriesPoint[]> {
    const buckets = await this.fileModel
      .aggregate<{ _id: string; count: number }>([
        { $match: { workspaceId, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .exec();
    return this.fillTimeSeries(buckets, start, end, (b) => ({ date: b._id, count: b.count }));
  }
}
