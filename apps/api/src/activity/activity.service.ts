import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import {
  Activity,
  ActivityDocument,
  ActivityType,
  ActivityEntityType,
} from './schemas/activity.schema';

export type RecordActivityParams = {
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  actorId: string;
  type: ActivityType;
  entityType?: ActivityEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @Inject(forwardRef(() => WorkspacesService))
    private workspacesService: WorkspacesService
  ) {}

  async record(data: RecordActivityParams): Promise<ActivityDocument> {
    const activity = new this.activityModel(data);
    return activity.save();
  }

  async list(params: {
    userId: string;
    workspaceId?: string;
    projectId?: string;
    taskId?: string;
    entityType?: ActivityEntityType;
    limit?: number;
    offset?: number;
  }): Promise<ActivityDocument[]> {
    const { userId, limit = 50, offset = 0 } = params;

    const hasFilter = !!params.workspaceId || !!params.projectId || !!params.taskId;
    if (!hasFilter) {
      throw new BadRequestException('workspaceId, projectId, or taskId is required');
    }

    const workspaceId = await this.resolveWorkspaceId(params);
    if (!workspaceId) {
      throw new BadRequestException('Unable to resolve workspaceId');
    }

    const member = await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const query: Record<string, unknown> = { workspaceId };
    if (params.projectId) query.projectId = params.projectId;
    if (params.taskId) query.taskId = params.taskId;
    if (params.entityType) query.entityType = params.entityType;

    const pipeline: any[] = [
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: Math.min(limit, 200) },
      {
        $lookup: {
          from: 'users',
          let: { aid: '$actorId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$aid'] },
                    { $eq: [{ $toString: '$_id' }, { $ifNull: ['$$aid', ''] }] },
                  ],
                },
              },
            },
            { $project: { username: 1, firstName: 1, lastName: 1, avatar: 1 } },
          ],
          as: 'actor',
        },
      },
      { $unwind: { path: '$actor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          workspaceId: 1,
          projectId: 1,
          taskId: 1,
          actorId: 1,
          type: 1,
          entityType: 1,
          entityId: 1,
          metadata: 1,
          createdAt: 1,
          updatedAt: 1,
          actor: {
            _id: '$actor._id',
            username: '$actor.username',
            firstName: '$actor.firstName',
            lastName: '$actor.lastName',
            avatar: '$actor.avatar',
          },
        },
      },
    ];

    const results = await this.activityModel.aggregate(pipeline).exec();
    return results as ActivityDocument[];
  }

  private async resolveWorkspaceId(params: {
    workspaceId?: string;
    projectId?: string;
    taskId?: string;
  }): Promise<string | null> {
    if (params.workspaceId) return params.workspaceId;

    if (params.projectId) {
      const project = await this.projectModel.findById(params.projectId).exec();
      if (!project) throw new NotFoundException('Project not found');
      return project.workspaceId;
    }

    if (params.taskId) {
      const task = await this.taskModel.findById(params.taskId).exec();
      if (!task) throw new NotFoundException('Task not found');
      return task.workspaceId;
    }

    return null;
  }
}

