import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationType, UserRole } from '@teamhub/shared';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { NotificationsService } from '../notifications/notifications.service';
import { hasPermission, Permission, rolesWithPermission } from '../common/permissions';
import { CreateReportDto } from './dto/create-report.dto';
import { Report, ReportDocument } from './schemas/report.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private workspacesService: WorkspacesService,
    private notificationsService: NotificationsService
  ) {}

  async create(reporterId: string, dto: CreateReportDto): Promise<ReportDocument> {
    const reporter = await this.workspacesService.getWorkspaceMember(dto.teamId, reporterId);
    if (!reporter) throw new ForbiddenException('You are not a member of this team');
    const target = await this.workspacesService.getWorkspaceMember(dto.teamId, dto.targetUserId);
    if (!target) throw new ForbiddenException('Target user is not a team member');

    const routedToRoles = this.resolveRoutingRoles(reporter.role, target.role, dto.type);
    const report = await this.reportModel.create({
      reporterId,
      targetUserId: dto.targetUserId,
      teamId: dto.teamId,
      messageId: dto.messageId,
      type: dto.type,
      description: dto.description,
      status: 'pending',
      routedToRoles,
    });

    const recipients = await this.workspacesService.getWorkspaceMembersByRoles(
      dto.teamId,
      routedToRoles as UserRole[]
    );
    const recipientIds = recipients.map((m) => {
      const userRef = m.userId as any;
      return typeof userRef === 'object' && userRef?._id
        ? userRef._id.toString()
        : String(userRef);
    });
    if (recipientIds.length > 0) {
      await this.notificationsService.createForUsers(
        recipientIds,
        dto.teamId,
        NotificationType.REPORT_SUBMITTED,
        'New report submitted',
        dto.description.slice(0, 120),
        '/hr/reports',
        { reportId: report._id.toString(), type: dto.type }
      );
    }
    return report;
  }

  async getHrReports(userId: string): Promise<ReportDocument[]> {
    await this.ensureRole(userId, rolesWithPermission(Permission.VIEW_HR_REPORTS));
    return this.reportModel.find().sort({ createdAt: -1 }).limit(200).exec();
  }

  private async ensureRole(userId: string, roles: UserRole[]): Promise<void> {
    const workspaces = await this.workspacesService.getUserWorkspaces(userId);
    const checks = await Promise.all(
      workspaces.map((w) => this.workspacesService.getWorkspaceMember(w._id.toString(), userId))
    );
    const hasRole = checks.some((m) => m && roles.includes(m.role));
    if (!hasRole) throw new ForbiddenException('Insufficient permissions');
  }

  private resolveRoutingRoles(
    reporterRole: UserRole,
    targetRole: UserRole,
    type: 'complaint' | 'workload_low' | 'workload_high'
  ): UserRole[] {
    const roles = new Set<UserRole>();
    if (type === 'workload_low' || type === 'workload_high') {
      roles.add(UserRole.SUPERVISOR);
      roles.add(UserRole.HR);
      return Array.from(roles);
    }
    if (reporterRole === UserRole.MEMBER) {
      if (targetRole === UserRole.LEADER) {
        roles.add(UserRole.SUPERVISOR);
      } else {
        roles.add(UserRole.LEADER);
      }
    } else if (reporterRole === UserRole.LEADER) {
      roles.add(UserRole.SUPERVISOR);
    } else {
      roles.add(UserRole.SUPERVISOR);
    }
    return Array.from(roles);
  }
}
