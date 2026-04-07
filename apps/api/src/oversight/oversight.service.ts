import { ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRole } from '@teamhub/shared';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@teamhub/shared';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { WorkspaceMember, WorkspaceMemberDocument } from '../workspaces/schemas/workspace-member.schema';
import { Report, ReportDocument } from '../reports/schemas/report.schema';

@Injectable()
export class OversightService implements OnModuleInit {
  private workloadTimer?: NodeJS.Timeout;

  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(WorkspaceMember.name) private memberModel: Model<WorkspaceMemberDocument>,
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private workspacesService: WorkspacesService,
    private notificationsService: NotificationsService
  ) {}

  onModuleInit() {
    // Lightweight fallback scheduler for workload checks every 15 minutes.
    this.workloadTimer = setInterval(() => {
      this.scanWorkload().catch(() => null);
    }, 15 * 60 * 1000);
  }

  async getSupervisorTeams(userId: string) {
    await this.ensureRoleInAnyWorkspace(userId, [UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.OWNER]);
    const workspaces = await this.workspacesService.getUserWorkspaces(userId);
    return workspaces.map((w) => ({ id: w._id.toString(), name: w.name }));
  }

  async getSupervisorTeamStats(userId: string, teamId: string) {
    await this.ensureRole(teamId, userId, [UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.OWNER]);
    const now = new Date();
    const [totalTasks, completedTasks, delayedTasks, activeMembers] = await Promise.all([
      this.taskModel.countDocuments({ workspaceId: teamId }),
      this.taskModel.countDocuments({ workspaceId: teamId, status: 'done' }),
      this.taskModel.countDocuments({ workspaceId: teamId, status: { $ne: 'done' }, dueAt: { $lt: now } }),
      this.memberModel.countDocuments({ workspaceId: teamId }),
    ]);
    return { totalTasks, completedTasks, delayedTasks, activeMembers };
  }

  async getHrReports(userId: string) {
    await this.ensureRoleInAnyWorkspace(userId, [UserRole.HR, UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.OWNER]);
    return this.reportModel.find().sort({ createdAt: -1 }).limit(300).exec();
  }

  async getHrWorkload(userId: string) {
    await this.ensureRoleInAnyWorkspace(userId, [UserRole.HR, UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.OWNER]);
    return this.computeWorkloadSummary();
  }

  async scanWorkload() {
    const summary = await this.computeWorkloadSummary();
    for (const item of summary.idleUsers) {
      await this.ensureWorkloadReport(item.workspaceId, item.userId, 'workload_low', 'Auto-detected low workload');
    }
    for (const item of summary.overworkedUsers) {
      await this.ensureWorkloadReport(item.workspaceId, item.userId, 'workload_high', 'Auto-detected high workload');
    }
  }

  private async ensureWorkloadReport(
    teamId: string,
    targetUserId: string,
    type: 'workload_low' | 'workload_high',
    description: string
  ) {
    const exists = await this.reportModel.findOne({
      teamId,
      targetUserId,
      type,
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    if (exists) return;
    const report = await this.reportModel.create({
      reporterId: 'system',
      targetUserId,
      teamId,
      type,
      description,
      status: 'pending',
      routedToRoles: [UserRole.SUPERVISOR, UserRole.HR],
    });
    const recipients = await this.workspacesService.getWorkspaceMembersByRoles(teamId, [
      UserRole.SUPERVISOR,
      UserRole.HR,
    ]);
    const recipientIds = recipients.map((m) => {
      const userRef = m.userId as any;
      return typeof userRef === 'object' && userRef?._id
        ? userRef._id.toString()
        : String(userRef);
    });
    if (recipientIds.length > 0) {
      await this.notificationsService.createForUsers(
        recipientIds,
        teamId,
        NotificationType.REPORT_SUBMITTED,
        'Workload report submitted',
        description,
        '/hr/workload',
        { reportId: report._id.toString(), type }
      );
    }
  }

  private async computeWorkloadSummary() {
    const members = await this.memberModel.find().exec();
    const summary = {
      overworkedUsers: [] as Array<{ workspaceId: string; userId: string; activeTasks: number }>,
      idleUsers: [] as Array<{ workspaceId: string; userId: string; activeTasks: number }>,
    };
    for (const member of members) {
      const activeTasks = await this.taskModel.countDocuments({
        workspaceId: member.workspaceId,
        assigneeId: member.userId.toString(),
        status: { $ne: 'done' },
      });
      if (activeTasks === 0) {
        summary.idleUsers.push({
          workspaceId: member.workspaceId,
          userId: member.userId.toString(),
          activeTasks,
        });
      } else if (activeTasks >= 8) {
        summary.overworkedUsers.push({
          workspaceId: member.workspaceId,
          userId: member.userId.toString(),
          activeTasks,
        });
      }
    }
    return summary;
  }

  private async ensureRole(
    workspaceId: string,
    userId: string,
    allowedRoles: UserRole[]
  ): Promise<void> {
    await this.workspacesService.ensureMemberWithRole(workspaceId, userId, allowedRoles);
  }

  private async ensureRoleInAnyWorkspace(userId: string, allowedRoles: UserRole[]): Promise<void> {
    const workspaces = await this.workspacesService.getUserWorkspaces(userId);
    for (const w of workspaces) {
      const member = await this.workspacesService.getWorkspaceMember(w._id.toString(), userId);
      if (member && allowedRoles.includes(member.role)) return;
    }
    throw new ForbiddenException('Insufficient permissions');
  }
}
