import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRole } from '@teamhub/shared';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { Project, ProjectDocument } from '../projects/schemas/project.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { ActivityService } from '../activity/activity.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment, CommentDocument } from './schemas/comment.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private workspacesService: WorkspacesService,
    private activityService: ActivityService
  ) {}

  async create(userId: string, dto: CreateCommentDto): Promise<CommentDocument> {
    const project = await this.projectModel.findById(dto.projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.workspaceId !== dto.workspaceId) {
      throw new BadRequestException('Project must belong to the provided workspace');
    }

    const task = await this.taskModel.findById(dto.taskId).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.projectId !== dto.projectId) {
      throw new BadRequestException('Task must belong to the provided project');
    }

    if (task.workspaceId !== dto.workspaceId) {
      throw new BadRequestException('Task must belong to the provided workspace');
    }

    await this.ensureProjectAccess(project, userId);

    const comment = new this.commentModel({
      taskId: dto.taskId,
      projectId: dto.projectId,
      workspaceId: dto.workspaceId,
      body: dto.body,
      createdBy: userId,
    });

    const saved = await comment.save();

    await this.activityService.record({
      workspaceId: dto.workspaceId,
      projectId: dto.projectId,
      taskId: dto.taskId,
      actorId: userId,
      type: 'COMMENT_ADDED',
      metadata: { commentId: saved._id.toString() },
    });

    return saved;
  }

  async findByTask(taskId: string, userId: string): Promise<CommentDocument[]> {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const project = await this.projectModel.findById(task.projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.workspaceId !== task.workspaceId) {
      throw new BadRequestException('Task workspace mismatch');
    }

    await this.ensureProjectAccess(project, userId);

    return this.commentModel
      .find({ taskId, projectId: task.projectId, workspaceId: task.workspaceId })
      .sort({ createdAt: 1 })
      .exec();
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.commentModel.findById(id).exec();
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      comment.workspaceId,
      userId
    );
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const canDelete =
      comment.createdBy === userId ||
      workspaceMember.role === UserRole.OWNER ||
      workspaceMember.role === UserRole.ADMIN;

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    await this.commentModel.findByIdAndDelete(id).exec();

    await this.activityService.record({
      workspaceId: comment.workspaceId,
      projectId: comment.projectId,
      taskId: comment.taskId,
      actorId: userId,
      type: 'COMMENT_DELETED',
      metadata: { commentId: id },
    });
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

