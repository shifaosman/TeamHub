import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteToWorkspaceDto } from './dto/invite-to-workspace.dto';
import { CreateInviteLinkDto } from './dto/create-invite-link.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('workspaces')
@Controller('workspaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  // Organizations
  @Post('organizations')
  @ApiOperation({ summary: 'Create a new organization' })
  createOrganization(
    @CurrentUser() user: any,
    @Body() createOrgDto: CreateOrganizationDto
  ) {
    return this.workspacesService.createOrganization(user.userId, createOrgDto);
  }

  @Get('organizations')
  @ApiOperation({ summary: 'Get user organizations' })
  getUserOrganizations(@CurrentUser() user: any) {
    return this.workspacesService.findOrganizationsByOwner(user.userId);
  }

  @Get('organizations/:id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  getOrganization(@Param('id') id: string) {
    return this.workspacesService.findOrganizationById(id);
  }

  // Workspaces
  @Post('workspaces')
  @ApiOperation({ summary: 'Create a new workspace' })
  createWorkspace(@CurrentUser() user: any, @Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.createWorkspace(user.userId, createWorkspaceDto);
  }

  @Get('workspaces')
  @ApiOperation({ summary: 'Get user workspaces' })
  getUserWorkspaces(@CurrentUser() user: any) {
    return this.workspacesService.getUserWorkspaces(user.userId);
  }

  @Get('workspaces/organization/:organizationId')
  @ApiOperation({ summary: 'Get workspaces by organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  getWorkspacesByOrganization(@Param('organizationId') organizationId: string) {
    return this.workspacesService.findWorkspacesByOrganization(organizationId);
  }

  @Get('workspaces/:id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  getWorkspace(@Param('id') id: string) {
    return this.workspacesService.findWorkspaceById(id);
  }

  @Patch('workspaces/:id')
  @ApiOperation({ summary: 'Update workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  updateWorkspace(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdateWorkspaceDto
  ) {
    return this.workspacesService.updateWorkspace(id, user.userId, updateDto);
  }

  @Delete('workspaces/:id')
  @ApiOperation({ summary: 'Delete workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  deleteWorkspace(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workspacesService.deleteWorkspace(id, user.userId);
  }

  // Workspace Members
  @Get('workspaces/:id/members')
  @ApiOperation({ summary: 'Get workspace members' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  getWorkspaceMembers(@Param('id') id: string) {
    return this.workspacesService.getWorkspaceMembers(id);
  }

  @Patch('workspaces/:id/members/:userId/role')
  @ApiOperation({ summary: 'Update member role' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  updateMemberRole(
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdateMemberRoleDto
  ) {
    return this.workspacesService.updateMemberRole(
      workspaceId,
      targetUserId,
      user.userId,
      updateDto
    );
  }

  @Delete('workspaces/:id/members/:userId')
  @ApiOperation({ summary: 'Remove member from workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  removeMember(
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: any
  ) {
    return this.workspacesService.removeMember(workspaceId, targetUserId, user.userId);
  }

  // Workspace Invites
  @Post('workspaces/:id/invites')
  @ApiOperation({ summary: 'Invite user to workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  inviteToWorkspace(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() inviteDto: InviteToWorkspaceDto
  ) {
    return this.workspacesService.inviteToWorkspace(id, user.userId, inviteDto);
  }

  @Post('workspaces/:id/invite-links')
  @ApiOperation({ summary: 'Create a shareable invite link/code for a workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  createInviteLink(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateInviteLinkDto
  ) {
    return this.workspacesService.createInviteLink(id, user.userId, dto);
  }

  @Post('invites/:token/accept')
  @ApiOperation({ summary: 'Accept workspace invite (token or code)' })
  @ApiParam({ name: 'token', description: 'Invite token or invite code' })
  acceptInvite(@Param('token') token: string, @CurrentUser() user: any) {
    return this.workspacesService.acceptInvite(token, user.userId);
  }

  @Get('workspaces/:id/invites')
  @ApiOperation({ summary: 'Get workspace invites' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  getWorkspaceInvites(@Param('id') id: string) {
    return this.workspacesService.getWorkspaceInvites(id);
  }

  // Audit Logs
  @Get('workspaces/:id/audit-logs')
  @ApiOperation({ summary: 'Get workspace audit logs' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  getAuditLogs(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.workspacesService.getAuditLogs(id, limit || 50, offset || 0);
  }
}
