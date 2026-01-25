import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from './schemas/organization.schema';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { WorkspaceMember, WorkspaceMemberDocument } from './schemas/workspace-member.schema';
import { WorkspaceInvite, WorkspaceInviteDocument } from './schemas/workspace-invite.schema';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteToWorkspaceDto } from './dto/invite-to-workspace.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UserRole } from '@teamhub/shared';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<OrganizationDocument>,
    @InjectModel(Workspace.name)
    private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(WorkspaceMember.name)
    private workspaceMemberModel: Model<WorkspaceMemberDocument>,
    @InjectModel(WorkspaceInvite.name)
    private workspaceInviteModel: Model<WorkspaceInviteDocument>,
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>
  ) {}

  // Organizations
  async createOrganization(
    userId: string,
    createOrgDto: CreateOrganizationDto
  ): Promise<OrganizationDocument> {
    const existing = await this.organizationModel.findOne({ slug: createOrgDto.slug }).exec();
    if (existing) {
      throw new BadRequestException('Organization slug already exists');
    }

    const organization = new this.organizationModel({
      ...createOrgDto,
      ownerId: userId,
    });

    return organization.save();
  }

  async findOrganizationById(id: string): Promise<OrganizationDocument> {
    const org = await this.organizationModel.findById(id).exec();
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return org;
  }

  async findOrganizationsByOwner(userId: string): Promise<OrganizationDocument[]> {
    return this.organizationModel.find({ ownerId: userId }).exec();
  }

  // Workspaces
  async createWorkspace(
    userId: string,
    createWorkspaceDto: CreateWorkspaceDto
  ): Promise<WorkspaceDocument> {
    // Verify organization exists and user is owner
    const org = await this.findOrganizationById(createWorkspaceDto.organizationId);
    if (org.ownerId !== userId) {
      throw new ForbiddenException('Only organization owner can create workspaces');
    }

    // Check if slug already exists in this organization
    const existing = await this.workspaceModel
      .findOne({
        organizationId: createWorkspaceDto.organizationId,
        slug: createWorkspaceDto.slug,
      })
      .exec();

    if (existing) {
      throw new BadRequestException('Workspace slug already exists in this organization');
    }

    const workspace = new this.workspaceModel({
      ...createWorkspaceDto,
      createdBy: userId,
    });

    const savedWorkspace = await workspace.save();

    // Add creator as owner member
    await this.workspaceMemberModel.create({
      workspaceId: savedWorkspace._id.toString(),
      userId,
      role: UserRole.OWNER,
    });

    // Create audit log
    await this.createAuditLog({
      workspaceId: savedWorkspace._id.toString(),
      userId,
      action: 'workspace.created',
      resourceType: 'workspace',
      resourceId: savedWorkspace._id.toString(),
    });

    return savedWorkspace;
  }

  async findWorkspaceById(id: string): Promise<WorkspaceDocument> {
    const workspace = await this.workspaceModel.findById(id).exec();
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    return workspace;
  }

  async findWorkspacesByOrganization(organizationId: string): Promise<WorkspaceDocument[]> {
    return this.workspaceModel.find({ organizationId }).exec();
  }

  async updateWorkspace(
    workspaceId: string,
    userId: string,
    updateDto: UpdateWorkspaceDto
  ): Promise<WorkspaceDocument> {
    // Check permissions
    await this.ensureMemberWithRole(workspaceId, userId, [UserRole.OWNER, UserRole.ADMIN]);

    const workspace = await this.findWorkspaceById(workspaceId);
    Object.assign(workspace, updateDto);

    await this.createAuditLog({
      workspaceId,
      userId,
      action: 'workspace.updated',
      resourceType: 'workspace',
      resourceId: workspaceId,
      metadata: updateDto,
    });

    return workspace.save();
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    // Only owner can delete
    await this.ensureMemberWithRole(workspaceId, userId, [UserRole.OWNER]);

    await this.workspaceModel.findByIdAndDelete(workspaceId).exec();
    await this.workspaceMemberModel.deleteMany({ workspaceId }).exec();
    await this.workspaceInviteModel.deleteMany({ workspaceId }).exec();

    await this.createAuditLog({
      workspaceId,
      userId,
      action: 'workspace.deleted',
      resourceType: 'workspace',
      resourceId: workspaceId,
    });
  }

  // Workspace Members
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberDocument[]> {
    return this.workspaceMemberModel
      .find({ workspaceId })
      .populate('userId', 'email username firstName lastName avatar')
      .exec();
  }

  async getWorkspaceMember(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMemberDocument | null> {
    return this.workspaceMemberModel.findOne({ workspaceId, userId }).exec();
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    updaterUserId: string,
    updateDto: UpdateMemberRoleDto
  ): Promise<WorkspaceMemberDocument> {
    // Only owner/admin can update roles
    await this.ensureMemberWithRole(workspaceId, updaterUserId, [UserRole.OWNER, UserRole.ADMIN]);

    // Cannot change owner role
    const targetMember = await this.getWorkspaceMember(workspaceId, targetUserId);
    if (!targetMember) {
      throw new NotFoundException('Member not found in workspace');
    }

    if (targetMember.role === UserRole.OWNER && updateDto.role !== UserRole.OWNER) {
      throw new BadRequestException('Cannot change owner role');
    }

    targetMember.role = updateDto.role;
    await targetMember.save();

    await this.createAuditLog({
      workspaceId,
      userId: updaterUserId,
      action: 'member.role.updated',
      resourceType: 'workspace_member',
      resourceId: targetUserId,
      metadata: { newRole: updateDto.role, previousRole: targetMember.role },
    });

    return targetMember;
  }

  async removeMember(
    workspaceId: string,
    targetUserId: string,
    removerUserId: string
  ): Promise<void> {
    // Only owner/admin can remove members
    await this.ensureMemberWithRole(workspaceId, removerUserId, [UserRole.OWNER, UserRole.ADMIN]);

    const targetMember = await this.getWorkspaceMember(workspaceId, targetUserId);
    if (!targetMember) {
      throw new NotFoundException('Member not found in workspace');
    }

    // Cannot remove owner
    if (targetMember.role === UserRole.OWNER) {
      throw new BadRequestException('Cannot remove workspace owner');
    }

    await this.workspaceMemberModel.deleteOne({ workspaceId, userId: targetUserId }).exec();

    await this.createAuditLog({
      workspaceId,
      userId: removerUserId,
      action: 'member.removed',
      resourceType: 'workspace_member',
      resourceId: targetUserId,
    });
  }

  // Workspace Invites
  async inviteToWorkspace(
    workspaceId: string,
    inviterUserId: string,
    inviteDto: InviteToWorkspaceDto
  ): Promise<WorkspaceInviteDocument> {
    // Check permissions
    await this.ensureMemberWithRole(workspaceId, inviterUserId, [UserRole.OWNER, UserRole.ADMIN]);

    // Note: In a real app, you'd check if a user with this email is already a member
    // For now, we'll just check for existing invites

    // Check for existing pending invite
    const existingInvite = await this.workspaceInviteModel
      .findOne({
        workspaceId,
        email: inviteDto.email,
        expiresAt: { $gt: new Date() },
        usedAt: null,
      })
      .exec();

    if (existingInvite) {
      throw new BadRequestException('Invite already sent to this email');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invite = new this.workspaceInviteModel({
      workspaceId,
      email: inviteDto.email,
      role: inviteDto.role || UserRole.MEMBER,
      invitedBy: inviterUserId,
      expiresAt,
    });

    await this.createAuditLog({
      workspaceId,
      userId: inviterUserId,
      action: 'invite.created',
      resourceType: 'workspace_invite',
      metadata: { email: inviteDto.email, role: inviteDto.role },
    });

    return invite.save();
  }

  async acceptInvite(token: string, userId: string): Promise<WorkspaceMemberDocument> {
    const invite = await this.workspaceInviteModel
      .findOne({ token, expiresAt: { $gt: new Date() }, usedAt: null })
      .exec();

    if (!invite) {
      throw new BadRequestException('Invalid or expired invite token');
    }

    // Verify user email matches invite
    // Note: In a real app, you'd verify the user's email from the user document
    // For now, we'll just check if they're already a member
    const existingMember = await this.getWorkspaceMember(invite.workspaceId, userId);
    if (existingMember) {
      throw new BadRequestException('User is already a member of this workspace');
    }

    // Mark invite as used
    invite.usedAt = new Date();
    await invite.save();

    // Add user as member
    const member = new this.workspaceMemberModel({
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
    });

    await this.createAuditLog({
      workspaceId: invite.workspaceId,
      userId,
      action: 'invite.accepted',
      resourceType: 'workspace_invite',
      resourceId: invite._id.toString(),
    });

    return member.save();
  }

  async getWorkspaceInvites(workspaceId: string): Promise<WorkspaceInviteDocument[]> {
    return this.workspaceInviteModel
      .find({ workspaceId, expiresAt: { $gt: new Date() }, usedAt: null })
      .populate('invitedBy', 'username email')
      .exec();
  }

  // Audit Logs
  async createAuditLog(data: {
    workspaceId: string;
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<AuditLogDocument> {
    const auditLog = new this.auditLogModel(data);
    return auditLog.save();
  }

  async getAuditLogs(
    workspaceId: string,
    limit = 50,
    offset = 0
  ): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({ workspaceId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('userId', 'username email')
      .exec();
  }

  // Permission helpers
  async ensureMemberWithRole(
    workspaceId: string,
    userId: string,
    allowedRoles: UserRole[]
  ): Promise<WorkspaceMemberDocument> {
    const member = await this.getWorkspaceMember(workspaceId, userId);
    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return member;
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceDocument[]> {
    const memberships = await this.workspaceMemberModel.find({ userId }).exec();
    const workspaceIds = memberships.map((m) => m.workspaceId);

    if (workspaceIds.length === 0) {
      return [];
    }

    return this.workspaceModel.find({ _id: { $in: workspaceIds } }).exec();
  }
}
