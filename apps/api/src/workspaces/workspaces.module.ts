import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { Organization, OrganizationSchema } from './schemas/organization.schema';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import { WorkspaceMember, WorkspaceMemberSchema } from './schemas/workspace-member.schema';
import { WorkspaceInvite, WorkspaceInviteSchema } from './schemas/workspace-invite.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { Team, TeamSchema } from './schemas/team.schema';
import { TeamMember, TeamMemberSchema } from './schemas/team-member.schema';
import { Channel, ChannelSchema } from '../channels/schemas/channel.schema';
import { ChannelMember, ChannelMemberSchema } from '../channels/schemas/channel-member.schema';
import { UsersModule } from '../users/users.module';
import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: WorkspaceMember.name, schema: WorkspaceMemberSchema },
      { name: WorkspaceInvite.name, schema: WorkspaceInviteSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Team.name, schema: TeamSchema },
      { name: TeamMember.name, schema: TeamMemberSchema },
      { name: Channel.name, schema: ChannelSchema },
      { name: ChannelMember.name, schema: ChannelMemberSchema },
    ]),
    UsersModule,
    forwardRef(() => ActivityModule),
    forwardRef(() => NotificationsModule),
  ],
  providers: [WorkspacesService],
  controllers: [WorkspacesController],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
