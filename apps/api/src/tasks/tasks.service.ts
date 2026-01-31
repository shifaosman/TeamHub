import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationType, UserRole } from '@teamhub/shared';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GatewayGateway } from '../gateway/gateway.gateway';
import { ActivityService } from '../activity/activity.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateTaskFromMessageDto } from './dto/create-task-from-message.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { UpdateTaskAssigneeDto } from './dto/update-task-assignee.dto';
import { UpdateTaskDueDto } from './dto/update-task-due.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskWatchersDto } from './dto/update-task-watchers.dto';
import { Task, TaskDocument } from './schemas/task.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private workspacesService: WorkspacesService,
    private messagesService: MessagesService,
    private notificationsService: NotificationsService,
    private gateway: GatewayGateway,
    private activityService: ActivityService
  ) {}

  async create(userId: string, dto: CreateTaskDto): Promise<TaskDocument> {
    const project = await this.projectModel.findById(dto.projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.workspaceId !== dto.workspaceId) {
      throw new BadRequestException('Project must belong to the provided workspace');
    }

    await this.ensureProjectAccess(project, userId);

    if (dto.assigneeId) {
      const assignee = await this.workspacesService.getWorkspaceMember(project.workspaceId, dto.assigneeId);
      if (!assignee) {
        throw new BadRequestException('Assignee is not a member of this workspace');
      }
    }

    const status = dto.status || 'todo';
    const last = await this.taskModel
      .findOne({ projectId: dto.projectId, status })
      .sort({ order: -1 })
      .select('order')
      .exec();

    const nextOrder = last?.order !== undefined ? last.order + 1 : 0;

    const task = new this.taskModel({
      projectId: dto.projectId,
      workspaceId: dto.workspaceId,
      title: dto.title,
      description: dto.description,
      status,
      assigneeId: dto.assigneeId ?? null,
      watcherIds: [],
      createdBy: userId,
      order: nextOrder,
    });

    const saved = await task.save();

    await this.activityService.record({
      workspaceId: saved.workspaceId,
      projectId: saved.projectId,
      taskId: saved._id.toString(),
      actorId: userId,
      type: 'TASK_CREATED',
      metadata: { title: saved.title, status: saved.status },
    });

    return saved;
  }

  async createFromMessage(userId: string, dto: CreateTaskFromMessageDto): Promise<TaskDocument> {
    const message = await this.messagesService.findOne(dto.messageId, userId);

    const project = await this.projectModel.findById(dto.projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Multi-tenant safety: message and project must be in the same workspace
    if (project.workspaceId !== message.workspaceId) {
      throw new BadRequestException('Message must belong to the same workspace as the project');
    }

    await this.ensureProjectAccess(project, userId);

    if (dto.assigneeId) {
      const assignee = await this.workspacesService.getWorkspaceMember(project.workspaceId, dto.assigneeId);
      if (!assignee) {
        throw new BadRequestException('Assignee is not a member of this workspace');
      }
    }

    const titleFromMessage = (message.content || '').trim().replace(/\s+/g, ' ').substring(0, 120);
    const title = (dto.title?.trim() || titleFromMessage || 'Task from message').substring(0, 120);
    const status = dto.status || 'todo';

    const last = await this.taskModel
      .findOne({ projectId: dto.projectId, status })
      .sort({ order: -1 })
      .select('order')
      .exec();
    const nextOrder = last?.order !== undefined ? last.order + 1 : 0;

    const task = new this.taskModel({
      projectId: dto.projectId,
      workspaceId: project.workspaceId,
      sourceWorkspaceId: message.workspaceId,
      sourceChannelId: message.channelId,
      sourceMessageId: dto.messageId,
      title,
      status,
      assigneeId: dto.assigneeId ?? null,
      watcherIds: [],
      createdBy: userId,
      order: nextOrder,
    });

    const saved = await task.save();

    // Emit socket events so clients can update in real-time
    this.gateway.emitToChannel(message.channelId, 'task:created', saved);
    this.gateway.emitToWorkspace(project.workspaceId, 'task:created', saved);

    await this.activityService.record({
      workspaceId: saved.workspaceId,
      projectId: saved.projectId,
      taskId: saved._id.toString(),
      actorId: userId,
      type: 'TASK_CREATED_FROM_MESSAGE',
      metadata: {
        title: saved.title,
        status: saved.status,
        sourceMessageId: dto.messageId,
        sourceChannelId: message.channelId,
      },
    });

    // Notify assignee (if provided and different from creator)
    if (dto.assigneeId && dto.assigneeId !== userId) {
      const link = `/projects/${dto.projectId}?taskId=${saved._id.toString()}`;
      await this.notificationsService.create({
        userId: dto.assigneeId,
        workspaceId: project.workspaceId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'You were assigned a task',
        body: title,
        link,
        metadata: {
          taskId: saved._id.toString(),
          projectId: dto.projectId,
          sourceMessageId: dto.messageId,
          sourceChannelId: message.channelId,
        },
      });

      // Emit to user for real-time UI notification
      this.gateway.emitToUser(dto.assigneeId, 'notification:new', {
        type: 'task_assigned',
        title: 'You were assigned a task',
        body: title,
        link,
      });
    }

    return saved;
  }

  async findAll(params: {
    projectId: string;
    userId: string;
    status?: string;
    assigneeId?: string;
  }): Promise<TaskDocument[]> {
    const project = await this.projectModel.findById(params.projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.ensureProjectAccess(project, params.userId);

    const query: any = { projectId: params.projectId, workspaceId: project.workspaceId };
    if (params.status) {
      query.status = params.status;
    }
    if (params.assigneeId) {
      query.assigneeId = params.assigneeId;
    }

    return this.taskModel.find(query).sort({ status: 1, order: 1 }).exec();
  }

  async update(id: string, userId: string, dto: UpdateTaskDto): Promise<TaskDocument> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const project = await this.projectModel.findById(task.projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.workspaceId !== task.workspaceId) {
      throw new BadRequestException('Task workspace mismatch');
    }

    await this.ensureProjectAccess(project, userId);

    if (dto.assigneeId !== undefined) {
      const currentAssignee = (task.assigneeId ?? null) as string | null;
      const nextAssignee = (dto.assigneeId ?? null) as string | null;

      // Only validate workspace membership if the assignee is actually being changed.
      // This prevents status/title updates from failing when an old assignee was later removed from the workspace.
      if (nextAssignee !== currentAssignee) {
        if (nextAssignee) {
          const assignee = await this.workspacesService.getWorkspaceMember(
            project.workspaceId,
            nextAssignee
          );
          if (!assignee) {
            throw new BadRequestException('Assignee is not a member of this workspace');
          }
        }

        task.assigneeId = nextAssignee;
      }
    }

    if (dto.title !== undefined) task.title = dto.title;

    if (dto.description !== undefined) {
      task.description = dto.description === null ? undefined : dto.description;
    }

    const previousStatus = task.status;
    const statusChanged = dto.status !== undefined && dto.status !== task.status;
    if (dto.status !== undefined && dto.status !== task.status) {
      const nextStatus = dto.status;
      task.status = nextStatus;

      // Move to end of new column ordering
      const last = await this.taskModel
        .findOne({ projectId: task.projectId, status: nextStatus })
        .sort({ order: -1 })
        .select('order')
        .exec();
      task.order = last?.order !== undefined ? last.order + 1 : 0;
    }

    const saved = await task.save();

    await this.activityService.record({
      workspaceId: saved.workspaceId,
      projectId: saved.projectId,
      taskId: saved._id.toString(),
      actorId: userId,
      type: statusChanged ? 'TASK_MOVED' : 'TASK_UPDATED',
      metadata: statusChanged
        ? { title: saved.title, previousStatus, status: saved.status }
        : { title: saved.title },
    });

    // Notify watchers when status changes
    if (statusChanged && saved.watcherIds && saved.watcherIds.length > 0) {
      const watcherIds = saved.watcherIds.filter((id) => id !== userId);
      if (watcherIds.length > 0) {
        const link = `/projects/${saved.projectId}?taskId=${saved._id.toString()}`;
        await this.notificationsService.createForUsers(
          watcherIds,
          saved.workspaceId,
          NotificationType.TASK_UPDATED,
          'Task status updated',
          `${saved.title} → ${saved.status}`,
          link,
          {
            taskId: saved._id.toString(),
            projectId: saved.projectId,
            previousStatus,
            status: saved.status,
          }
        );

        for (const watcherId of watcherIds) {
          this.gateway.emitToUser(watcherId, 'notification:new', {
            type: 'task_updated',
            title: 'Task status updated',
            body: `${saved.title} → ${saved.status}`,
            link,
          });
        }
      }
    }

    return saved;
  }

  async updateAssignee(
    id: string,
    userId: string,
    dto: UpdateTaskAssigneeDto
  ): Promise<TaskDocument> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const project = await this.projectModel.findById(task.projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.workspaceId !== task.workspaceId) {
      throw new BadRequestException('Task workspace mismatch');
    }

    await this.ensureProjectAccess(project, userId);

    const nextAssignee = (dto.assigneeId ?? null) as string | null;

    if (nextAssignee) {
      const assignee = await this.workspacesService.getWorkspaceMember(project.workspaceId, nextAssignee);
      if (!assignee) {
        throw new BadRequestException('Assignee is not a member of this workspace');
      }
    }

    task.assigneeId = nextAssignee;
    const saved = await task.save();

    await this.activityService.record({
      workspaceId: saved.workspaceId,
      projectId: saved.projectId,
      taskId: saved._id.toString(),
      actorId: userId,
      type: 'TASK_ASSIGNED',
      metadata: { assigneeId: nextAssignee, title: saved.title },
    });

    if (nextAssignee && nextAssignee !== userId) {
      const link = `/projects/${saved.projectId}?taskId=${saved._id.toString()}`;
      await this.notificationsService.create({
        userId: nextAssignee,
        workspaceId: saved.workspaceId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'You were assigned a task',
        body: saved.title,
        link,
        metadata: {
          taskId: saved._id.toString(),
          projectId: saved.projectId,
        },
      });

      this.gateway.emitToUser(nextAssignee, 'notification:new', {
        type: 'task_assigned',
        title: 'You were assigned a task',
        body: saved.title,
        link,
      });
    }

    return saved;
  }

  async updateWatchers(
    id: string,
    userId: string,
    dto: UpdateTaskWatchersDto
  ): Promise<TaskDocument> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const project = await this.projectModel.findById(task.projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.workspaceId !== task.workspaceId) {
      throw new BadRequestException('Task workspace mismatch');
    }

    await this.ensureProjectAccess(project, userId);

    const watcherIds = Array.from(new Set(dto.watcherIds || [])).filter(Boolean);

    // Validate watchers are workspace members
    for (const watcherId of watcherIds) {
      const member = await this.workspacesService.getWorkspaceMember(project.workspaceId, watcherId);
      if (!member) {
        throw new BadRequestException(`User ${watcherId} is not a member of this workspace`);
      }
    }

    task.watcherIds = watcherIds;
    const saved = await task.save();

    await this.activityService.record({
      workspaceId: saved.workspaceId,
      projectId: saved.projectId,
      taskId: saved._id.toString(),
      actorId: userId,
      type: 'TASK_WATCHERS_UPDATED',
      metadata: { watcherIds },
    });

    return saved;
  }

  async updateDue(id: string, userId: string, dto: UpdateTaskDueDto): Promise<TaskDocument> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const project = await this.projectModel.findById(task.projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.workspaceId !== task.workspaceId) {
      throw new BadRequestException('Task workspace mismatch');
    }

    await this.ensureProjectAccess(project, userId);

    if (dto.dueAt === null) {
      task.dueAt = undefined;
      task.reminder24hSentAt = undefined;
      task.reminder1hSentAt = undefined;
      const saved = await task.save();
      await this.activityService.record({
        workspaceId: saved.workspaceId,
        projectId: saved.projectId,
        taskId: saved._id.toString(),
        actorId: userId,
        type: 'TASK_DUE_UPDATED',
        metadata: { dueAt: null },
      });
      return saved;
    }

    if (dto.dueAt !== undefined) {
      task.dueAt = dto.dueAt ? new Date(dto.dueAt) : undefined;
      // Reset reminders when due date changes
      task.reminder24hSentAt = undefined;
      task.reminder1hSentAt = undefined;
    }

    const saved = await task.save();
    await this.activityService.record({
      workspaceId: saved.workspaceId,
      projectId: saved.projectId,
      taskId: saved._id.toString(),
      actorId: userId,
      type: 'TASK_DUE_UPDATED',
      metadata: { dueAt: saved.dueAt ? saved.dueAt.toISOString() : null },
    });
    return saved;
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const workspaceMember = await this.workspacesService.getWorkspaceMember(task.workspaceId, userId);
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const canDelete =
      task.createdBy === userId ||
      workspaceMember.role === UserRole.OWNER ||
      workspaceMember.role === UserRole.ADMIN;

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    await this.commentModel.deleteMany({ taskId: id }).exec();
    await this.taskModel.findByIdAndDelete(id).exec();

    await this.activityService.record({
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      taskId: id,
      actorId: userId,
      type: 'TASK_UPDATED',
      metadata: { deleted: true },
    });
  }

  async reorder(userId: string, dto: ReorderTasksDto): Promise<{ updated: number }> {
    const project = await this.projectModel.findById(dto.projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.workspaceId !== dto.workspaceId) {
      throw new BadRequestException('Project must belong to the provided workspace');
    }

    await this.ensureProjectAccess(project, userId);

    const taskIds = dto.items.map((i) => i.taskId);
    const tasks = await this.taskModel
      .find({ _id: { $in: taskIds }, projectId: dto.projectId, workspaceId: dto.workspaceId })
      .select('_id status watcherIds title projectId workspaceId')
      .exec();

    if (tasks.length !== taskIds.length) {
      throw new NotFoundException('One or more tasks were not found in this project');
    }

    const bulkOps = dto.items.map((item) => ({
      updateOne: {
        filter: { _id: item.taskId, projectId: dto.projectId, workspaceId: dto.workspaceId },
        update: {
          $set: {
            order: item.order,
            ...(item.status ? { status: item.status } : {}),
          },
        },
      },
    }));

    if (bulkOps.length === 0) {
      return { updated: 0 };
    }

    await this.taskModel.bulkWrite(bulkOps);

    // Notify watchers for any status changes in this bulk update
    const taskById = new Map(tasks.map((t) => [t._id.toString(), t] as const));
    const changedStatusTasks: Array<{
      task: any;
      previousStatus: string;
      nextStatus: string;
    }> = [];

    for (const item of dto.items) {
      if (!item.status) continue;
      const existing = taskById.get(item.taskId);
      if (!existing) continue;
      if (existing.status !== item.status) {
        changedStatusTasks.push({
          task: existing,
          previousStatus: existing.status,
          nextStatus: item.status,
        });
      }
    }

    // Activity: record moves for status changes (order-only changes are noisy; skip for now)
    for (const change of changedStatusTasks) {
      await this.activityService.record({
        workspaceId: dto.workspaceId,
        projectId: dto.projectId,
        taskId: change.task._id.toString(),
        actorId: userId,
        type: 'TASK_MOVED',
        metadata: { title: change.task.title, previousStatus: change.previousStatus, status: change.nextStatus },
      });
    }

    for (const change of changedStatusTasks) {
      const watcherIds = (change.task.watcherIds || []).filter((id: string) => id !== userId);
      if (watcherIds.length === 0) continue;
      const link = `/projects/${dto.projectId}?taskId=${change.task._id.toString()}`;
      await this.notificationsService.createForUsers(
        watcherIds,
        dto.workspaceId,
        NotificationType.TASK_UPDATED,
        'Task status updated',
        `${change.task.title} → ${change.nextStatus}`,
        link,
        {
          taskId: change.task._id.toString(),
          projectId: dto.projectId,
          previousStatus: change.previousStatus,
          status: change.nextStatus,
        }
      );

      for (const watcherId of watcherIds) {
        this.gateway.emitToUser(watcherId, 'notification:new', {
          type: 'task_updated',
          title: 'Task status updated',
          body: `${change.task.title} → ${change.nextStatus}`,
          link,
        });
      }
    }

    return { updated: bulkOps.length };
  }

  private async ensureProjectAccess(project: ProjectDocument, userId: string): Promise<void> {
    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      project.workspaceId,
      userId
    );
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const canBypass =
      workspaceMember.role === UserRole.OWNER || workspaceMember.role === UserRole.ADMIN;

    if (canBypass) {
      return;
    }

    const isProjectMember = project.members.some((m) => m.userId === userId);
    if (!isProjectMember) {
      throw new ForbiddenException('You are not a member of this project');
    }
  }
}

