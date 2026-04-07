import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityService } from '../activity/activity.service';
import { Organization, OrganizationDocument } from './schemas/organization.schema';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { WorkspaceMember, WorkspaceMemberDocument } from './schemas/workspace-member.schema';
import { WorkspaceInvite, WorkspaceInviteDocument } from './schemas/workspace-invite.schema';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { Team, TeamDocument } from './schemas/team.schema';
import { TeamMember, TeamMemberDocument } from './schemas/team-member.schema';
import { Channel, ChannelDocument } from '../channels/schemas/channel.schema';
import { ChannelMember, ChannelMemberDocument } from '../channels/schemas/channel-member.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteToWorkspaceDto } from './dto/invite-to-workspace.dto';
import { CreateInviteLinkDto } from './dto/create-invite-link.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddTeamMembersDto } from './dto/add-team-members.dto';
import { UserRole, ChannelType, NotificationType } from '@teamhub/shared';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { hasPermission, Permission, rolesWithPermission } from '../common/permissions';

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
    private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(Team.name)
    private teamModel: Model<TeamDocument>,
    @InjectModel(TeamMember.name)
    private teamMemberModel: Model<TeamMemberDocument>,
    @InjectModel(Channel.name)
    private channelModel: Model<ChannelDocument>,
    @InjectModel(ChannelMember.name)
    private channelMemberModel: Model<ChannelMemberDocument>,
    @Inject(forwardRef(() => ActivityService))
    private activityService: ActivityService,
    private usersService: UsersService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService
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

  async findOrganizationById(id: string, userId?: string): Promise<OrganizationDocument> {
    const org = await this.organizationModel.findById(id).exec();
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    if (userId) {
      const isOwner = org.ownerId === userId;
      if (!isOwner) {
        const orgWorkspaces = await this.workspaceModel
          .find({ organizationId: id })
          .select('_id')
          .lean()
          .exec();
        const workspaceIds = orgWorkspaces.map((w) => w._id.toString());
        const membership = workspaceIds.length > 0
          ? await this.workspaceMemberModel
              .findOne({ workspaceId: { $in: workspaceIds }, userId })
              .lean()
              .exec()
          : null;
        if (!membership) {
          throw new ForbiddenException('You do not have access to this organization');
        }
      }
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
    // Verify organization exists and user has elevated role in this organization
    const org = await this.findOrganizationById(createWorkspaceDto.organizationId);
    const canCreate = await this.canCreateWorkspaceInOrganization(userId, org._id.toString());
    if (!canCreate) {
      throw new ForbiddenException(
        'Only owner, admin, supervisor, or leader can create workspaces in this organization'
      );
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

    // Create a default public channel so users can start chatting immediately.
    const defaultChannel = await this.channelModel.create({
      workspaceId: savedWorkspace._id.toString(),
      name: 'general',
      slug: 'general',
      type: ChannelType.PUBLIC,
      description: 'Default channel for workspace conversations',
      createdBy: userId,
      memberIds: [userId],
      isArchived: false,
    });
    await this.channelMemberModel.create({
      channelId: defaultChannel._id.toString(),
      userId,
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

  async findWorkspaceById(id: string, userId?: string): Promise<WorkspaceDocument> {
    const workspace = await this.workspaceModel.findById(id).exec();
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    if (userId) {
      const member = await this.getWorkspaceMember(id, userId);
      if (!member) {
        throw new ForbiddenException('You are not a member of this workspace');
      }
    }
    return workspace;
  }

  async findWorkspacesByOrganization(
    organizationId: string,
    userId?: string
  ): Promise<WorkspaceDocument[]> {
    const workspaces = await this.workspaceModel.find({ organizationId }).exec();
    if (!userId) return workspaces;
    const accessible: WorkspaceDocument[] = [];
    for (const ws of workspaces) {
      const member = await this.getWorkspaceMember(ws._id.toString(), userId);
      if (member) accessible.push(ws);
    }
    return accessible;
  }

  async updateWorkspace(
    workspaceId: string,
    userId: string,
    updateDto: UpdateWorkspaceDto
  ): Promise<WorkspaceDocument> {
    await this.ensureMemberWithRole(
      workspaceId,
      userId,
      rolesWithPermission(Permission.UPDATE_WORKSPACE)
    );

    const workspace = await this.findWorkspaceById(workspaceId);
    Object.assign(workspace, updateDto);

    // Convert DTO to plain object for metadata
    const metadata: Record<string, unknown> = {};
    if (updateDto.name !== undefined) metadata.name = updateDto.name;
    if (updateDto.description !== undefined) metadata.description = updateDto.description;
    if (updateDto.settings !== undefined) metadata.settings = updateDto.settings;

    await this.createAuditLog({
      workspaceId,
      userId,
      action: 'workspace.updated',
      resourceType: 'workspace',
      resourceId: workspaceId,
      metadata,
    });

    return workspace.save();
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    await this.ensureMemberWithRole(
      workspaceId,
      userId,
      rolesWithPermission(Permission.DELETE_WORKSPACE)
    );

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
  async getWorkspaceMembers(
    workspaceId: string,
    requestingUserId?: string
  ): Promise<WorkspaceMemberDocument[]> {
    if (requestingUserId) {
      const member = await this.getWorkspaceMember(workspaceId, requestingUserId);
      if (!member) {
        throw new ForbiddenException('You are not a member of this workspace');
      }
    }
    return this.workspaceMemberModel
      .find({ workspaceId })
      .populate('userId', 'email username firstName lastName avatar')
      .exec();
  }

  async getWorkspaceMembersByRoles(
    workspaceId: string,
    roles: UserRole[]
  ): Promise<WorkspaceMemberDocument[]> {
    return this.workspaceMemberModel
      .find({ workspaceId, role: { $in: roles } })
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
    await this.ensureMemberWithRole(
      workspaceId,
      updaterUserId,
      rolesWithPermission(Permission.MANAGE_MEMBERS)
    );

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
    await this.ensureMemberWithRole(
      workspaceId,
      removerUserId,
      rolesWithPermission(Permission.MANAGE_MEMBERS)
    );

    const targetMember = await this.getWorkspaceMember(workspaceId, targetUserId);
    if (!targetMember) {
      throw new NotFoundException('Member not found in workspace');
    }

    // Cannot remove owner
    if (targetMember.role === UserRole.OWNER) {
      throw new BadRequestException('Cannot remove workspace owner');
    }

    await this.workspaceMemberModel.deleteOne({ workspaceId, userId: targetUserId }).exec();
    await this.teamMemberModel.deleteMany({ workspaceId, userId: targetUserId }).exec();

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
    await this.ensureMemberWithRole(
      workspaceId,
      inviterUserId,
      rolesWithPermission(Permission.INVITE_MEMBERS)
    );

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
      maxUses: 1,
      usesCount: 0,
    });

    await this.createAuditLog({
      workspaceId,
      userId: inviterUserId,
      action: 'invite.created',
      resourceType: 'workspace_invite',
      metadata: { email: inviteDto.email, role: inviteDto.role },
    });

    const saved = await invite.save();

    // If invited email belongs to an existing user, create in-app notification
    const invitedUser = await this.usersService.findByEmail(inviteDto.email);
    if (invitedUser) {
      const workspace = await this.workspaceModel.findById(workspaceId).select('name').lean().exec();
      const workspaceName = workspace?.name ?? 'a workspace';
      const link = `/join?token=${saved.token}`;
      await this.notificationsService.create({
        userId: invitedUser._id.toString(),
        workspaceId,
        type: NotificationType.WORKSPACE_INVITE,
        title: 'Workspace invite',
        body: `You were invited to ${workspaceName}`,
        link,
        entityType: 'workspace',
        entityId: workspaceId,
        metadata: { inviteId: saved._id.toString(), role: saved.role },
      });
    }

    return saved;
  }

  async createInviteLink(
    workspaceId: string,
    inviterUserId: string,
    dto: CreateInviteLinkDto
  ): Promise<WorkspaceInviteDocument> {
    await this.ensureMemberWithRole(
      workspaceId,
      inviterUserId,
      rolesWithPermission(Permission.INVITE_MEMBERS)
    );

    const expiresInDays = dto.expiresInDays ?? 7;
    const maxUses = dto.maxUses ?? 1;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invite = new this.workspaceInviteModel({
      workspaceId,
      role: dto.role || UserRole.MEMBER,
      invitedBy: inviterUserId,
      expiresAt,
      maxUses,
      usesCount: 0,
    });

    await this.createAuditLog({
      workspaceId,
      userId: inviterUserId,
      action: 'invite_link.created',
      resourceType: 'workspace_invite',
      resourceId: invite._id?.toString(),
      metadata: { role: dto.role, expiresInDays, maxUses },
    });

    return invite.save();
  }

  async acceptInvite(token: string, userId: string): Promise<WorkspaceMemberDocument> {
    const now = new Date();
    // Accept by token OR short code.
    const invite = await this.workspaceInviteModel
      .findOne({
        $or: [{ token }, { code: token }],
        expiresAt: { $gt: now },
      })
      .exec();

    if (!invite) {
      throw new BadRequestException('Invalid or expired invite token');
    }

    const maxUses = invite.maxUses ?? 1;
    const usesCount = invite.usesCount ?? 0;
    if (invite.usedAt || usesCount >= maxUses) {
      throw new BadRequestException('Invite link has already been used');
    }

    // Verify user email matches invite
    // Note: In a real app, you'd verify the user's email from the user document
    // For now, we'll just check if they're already a member
    const existingMember = await this.getWorkspaceMember(invite.workspaceId, userId);
    if (existingMember) {
      throw new BadRequestException('User is already a member of this workspace');
    }

    // Mark invite as used
    invite.usesCount = usesCount + 1;
    if (invite.usesCount >= maxUses) {
      invite.usedAt = now;
    }
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

    const savedMember = await member.save();

    await this.activityService.record({
      workspaceId: invite.workspaceId,
      actorId: userId,
      type: 'MEMBER_JOINED',
      entityType: 'workspace',
      entityId: invite.workspaceId,
      metadata: { role: invite.role },
    });

    return savedMember;
  }

  async getWorkspaceInvites(
    workspaceId: string,
    requestingUserId?: string
  ): Promise<WorkspaceInviteDocument[]> {
    if (requestingUserId) {
      await this.ensureMemberWithRole(
        workspaceId,
        requestingUserId,
        rolesWithPermission(Permission.INVITE_MEMBERS)
      );
    }
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
    requestingUserId: string,
    limit = 50,
    offset = 0
  ): Promise<AuditLogDocument[]> {
    await this.ensureMemberWithRole(
      workspaceId,
      requestingUserId,
      rolesWithPermission(Permission.VIEW_AUDIT_LOGS)
    );
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

  // Teams
  async createTeam(userId: string, dto: CreateTeamDto): Promise<TeamDocument> {
    await this.ensureMemberWithRole(
      dto.workspaceId,
      userId,
      rolesWithPermission(Permission.CREATE_TEAM)
    );

    const existing = await this.teamModel
      .findOne({ workspaceId: dto.workspaceId, name: dto.name })
      .lean()
      .exec();
    if (existing) {
      throw new BadRequestException('Team with this name already exists in the workspace');
    }

    const team = await this.teamModel.create({
      workspaceId: dto.workspaceId,
      name: dto.name,
      description: dto.description,
      createdBy: userId,
    });

    // Creator is added to team by default.
    await this.teamMemberModel.create({
      teamId: team._id.toString(),
      workspaceId: dto.workspaceId,
      userId,
    });

    return team;
  }

  async getWorkspaceTeams(workspaceId: string, userId: string): Promise<TeamDocument[]> {
    const membership = await this.getWorkspaceMember(workspaceId, userId);
    if (!membership) throw new ForbiddenException('You are not a member of this workspace');

    return this.teamModel.find({ workspaceId }).sort({ name: 1 }).exec();
  }

  async addMembersToTeam(
    teamId: string,
    actorUserId: string,
    dto: AddTeamMembersDto
  ): Promise<{ added: number }> {
    const team = await this.teamModel.findById(teamId).exec();
    if (!team) throw new NotFoundException('Team not found');

    await this.ensureMemberWithRole(
      team.workspaceId,
      actorUserId,
      rolesWithPermission(Permission.MANAGE_TEAM_MEMBERS)
    );

    let added = 0;
    for (const targetUserId of dto.userIds) {
      const workspaceMember = await this.getWorkspaceMember(team.workspaceId, targetUserId);
      if (!workspaceMember) {
        throw new BadRequestException(`User ${targetUserId} is not a workspace member`);
      }
      const existing = await this.teamMemberModel
        .findOne({ teamId, userId: targetUserId })
        .lean()
        .exec();
      if (existing) continue;
      await this.teamMemberModel.create({
        teamId,
        workspaceId: team.workspaceId,
        userId: targetUserId,
      });
      added += 1;
    }

    return { added };
  }

  async getTeamMembers(teamId: string, userId: string): Promise<TeamMemberDocument[]> {
    const team = await this.teamModel.findById(teamId).exec();
    if (!team) throw new NotFoundException('Team not found');

    const membership = await this.getWorkspaceMember(team.workspaceId, userId);
    if (!membership) throw new ForbiddenException('You are not a member of this workspace');

    return this.teamMemberModel
      .find({ teamId })
      .populate('userId', 'email username firstName lastName avatar')
      .exec();
  }

  async getUserTeamIds(workspaceId: string, userId: string): Promise<string[]> {
    const teams = await this.teamMemberModel
      .find({ workspaceId, userId })
      .select('teamId')
      .lean()
      .exec();
    return teams.map((t) => t.teamId);
  }

  async validateTeamIdsInWorkspace(workspaceId: string, teamIds: string[]): Promise<void> {
    if (!teamIds.length) return;
    const count = await this.teamModel
      .countDocuments({ _id: { $in: teamIds }, workspaceId })
      .exec();
    if (count !== teamIds.length) {
      throw new BadRequestException('One or more teams do not belong to this workspace');
    }
  }

  async userHasTeamAccess(workspaceId: string, userId: string, teamIds?: string[]): Promise<boolean> {
    if (!teamIds || teamIds.length === 0) return true;

    const workspaceMember = await this.getWorkspaceMember(workspaceId, userId);
    if (!workspaceMember) return false;
    if (hasPermission(workspaceMember.role as UserRole, Permission.MANAGE_TEAM_MEMBERS)) {
      return true;
    }

    const userTeams = await this.getUserTeamIds(workspaceId, userId);
    return teamIds.some((teamId) => userTeams.includes(teamId));
  }

  private async canCreateWorkspaceInOrganization(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    const org = await this.organizationModel.findById(organizationId).select('ownerId').lean().exec();
    if (!org) return false;
    if (org.ownerId === userId) return true;

    const allowedRoles = rolesWithPermission(Permission.CREATE_WORKSPACE);
    const orgWorkspaces = await this.workspaceModel
      .find({ organizationId })
      .select('_id')
      .lean()
      .exec();
    const workspaceIds = orgWorkspaces.map((w) => w._id.toString());
    if (workspaceIds.length === 0) return false;

    const elevatedMembership = await this.workspaceMemberModel
      .findOne({
        workspaceId: { $in: workspaceIds },
        userId,
        role: { $in: allowedRoles },
      })
      .lean()
      .exec();
    return Boolean(elevatedMembership);
  }
}
