import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { Organization, OrganizationSchema } from './schemas/organization.schema';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import { WorkspaceMember, WorkspaceMemberSchema } from './schemas/workspace-member.schema';
import { WorkspaceInvite, WorkspaceInviteSchema } from './schemas/workspace-invite.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: WorkspaceMember.name, schema: WorkspaceMemberSchema },
      { name: WorkspaceInvite.name, schema: WorkspaceInviteSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    UsersModule,
  ],
  providers: [WorkspacesService],
  controllers: [WorkspacesController],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
