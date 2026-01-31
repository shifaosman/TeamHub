import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Activity, ActivityDocument, ActivityType } from './schemas/activity.schema';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private workspacesService: WorkspacesService
  ) {}

  async record(data: {
    workspaceId: string;
    projectId?: string;
    taskId?: string;
    actorId: string;
    type: ActivityType;
    metadata?: Record<string, unknown>;
  }): Promise<ActivityDocument> {
    const activity = new this.activityModel(data);
    return activity.save();
  }

  async list(params: {
    userId: string;
    workspaceId?: string;
    projectId?: string;
    taskId?: string;
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

    const query: any = { workspaceId };
    if (params.projectId) query.projectId = params.projectId;
    if (params.taskId) query.taskId = params.taskId;

    return this.activityModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 200))
      .skip(offset)
      .exec();
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

