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
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-project-member-role.dto';
import { Project, ProjectDocument } from './schemas/project.schema';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    private workspacesService: WorkspacesService,
    private activityService: ActivityService
  ) {}

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectDocument> {
    // Verify workspace exists and user is a member
    await this.workspacesService.findWorkspaceById(dto.workspaceId);
    const workspaceMember = await this.workspacesService.getWorkspaceMember(dto.workspaceId, userId);
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const project = new this.projectModel({
      workspaceId: dto.workspaceId,
      name: dto.name,
      description: dto.description,
      createdBy: userId,
      members: [{ userId, role: 'admin' }],
    });

    const saved = await project.save();
    await this.activityService.record({
      workspaceId: saved.workspaceId,
      projectId: saved._id.toString(),
      actorId: userId,
      type: 'PROJECT_CREATED',
      metadata: { name: saved.name },
    });
    return saved;
  }

  async findAll(workspaceId: string, userId: string): Promise<ProjectDocument[]> {
    const workspaceMember = await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const canViewAll =
      workspaceMember.role === UserRole.OWNER || workspaceMember.role === UserRole.ADMIN;

    const query: any = { workspaceId };
    if (!canViewAll) {
      query['members.userId'] = userId;
    }

    return this.projectModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, userId: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      project.workspaceId,
      userId
    );
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const canViewAll =
      workspaceMember.role === UserRole.OWNER || workspaceMember.role === UserRole.ADMIN;

    if (!canViewAll && !this.isProjectMember(project, userId)) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return project;
  }

  async update(id: string, userId: string, dto: UpdateProjectDto): Promise<ProjectDocument> {
    const project = await this.findOne(id, userId);
    await this.ensureProjectAdminOrWorkspaceAdmin(project, userId);

    Object.assign(project, dto);
    const saved = await project.save();
    await this.activityService.record({
      workspaceId: saved.workspaceId,
      projectId: saved._id.toString(),
      actorId: userId,
      type: 'PROJECT_UPDATED',
      metadata: { name: saved.name },
    });
    return saved;
  }

  async addMember(
    projectId: string,
    actorUserId: string,
    dto: AddProjectMemberDto
  ): Promise<ProjectDocument> {
    const project = await this.findOne(projectId, actorUserId);
    await this.ensureProjectAdminOrWorkspaceAdmin(project, actorUserId);

    // Verify target user is a workspace member
    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      project.workspaceId,
      dto.userId
    );
    if (!workspaceMember) {
      throw new BadRequestException('User is not a member of this workspace');
    }

    const role = dto.role || 'member';
    const existing = project.members.find((m) => m.userId === dto.userId);
    if (existing) {
      existing.role = role;
    } else {
      project.members.push({ userId: dto.userId, role });
    }

    const saved = await project.save();
    await this.activityService.record({
      workspaceId: saved.workspaceId,
      projectId: saved._id.toString(),
      actorId: actorUserId,
      type: 'PROJECT_MEMBER_ADDED',
      metadata: { userId: dto.userId, role },
    });
    return saved;
  }

  async updateMemberRole(
    projectId: string,
    targetUserId: string,
    actorUserId: string,
    dto: UpdateProjectMemberRoleDto
  ): Promise<ProjectDocument> {
    const project = await this.findOne(projectId, actorUserId);
    await this.ensureProjectAdminOrWorkspaceAdmin(project, actorUserId);

    const member = project.members.find((m) => m.userId === targetUserId);
    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    if (member.role === 'admin' && dto.role === 'member') {
      const adminCount = project.members.filter((m) => m.role === 'admin').length;
      if (adminCount <= 1) {
        throw new BadRequestException('Project must have at least one admin');
      }
    }

    member.role = dto.role;
    const saved = await project.save();
    await this.activityService.record({
      workspaceId: saved.workspaceId,
      projectId: saved._id.toString(),
      actorId: actorUserId,
      type: 'PROJECT_MEMBER_ROLE_UPDATED',
      metadata: { userId: targetUserId, role: dto.role },
    });
    return saved;
  }

  async delete(id: string, userId: string): Promise<void> {
    const project = await this.projectModel.findById(id).exec();
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Only workspace owner/admin can delete projects
    await this.workspacesService.ensureMemberWithRole(project.workspaceId, userId, [
      UserRole.OWNER,
      UserRole.ADMIN,
    ]);

    await this.taskModel.deleteMany({ projectId: id }).exec();
    await this.commentModel.deleteMany({ projectId: id }).exec();
    await this.projectModel.findByIdAndDelete(id).exec();

    await this.activityService.record({
      workspaceId: project.workspaceId,
      projectId: id,
      actorId: userId,
      type: 'PROJECT_DELETED',
      metadata: { projectId: id },
    });
  }

  async ensureProjectMember(projectId: string, userId: string): Promise<ProjectDocument> {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      project.workspaceId,
      userId
    );
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const canBypass =
      workspaceMember.role === UserRole.OWNER || workspaceMember.role === UserRole.ADMIN;

    if (!canBypass && !this.isProjectMember(project, userId)) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return project;
  }

  private isProjectMember(project: ProjectDocument, userId: string): boolean {
    return project.members.some((m) => m.userId === userId);
  }

  private async ensureProjectAdminOrWorkspaceAdmin(
    project: ProjectDocument,
    userId: string
  ): Promise<void> {
    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      project.workspaceId,
      userId
    );
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const isWorkspaceAdmin =
      workspaceMember.role === UserRole.OWNER || workspaceMember.role === UserRole.ADMIN;

    const projectMember = project.members.find((m) => m.userId === userId);
    const isProjectAdmin = projectMember?.role === 'admin';

    if (!isWorkspaceAdmin && !isProjectAdmin) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}

