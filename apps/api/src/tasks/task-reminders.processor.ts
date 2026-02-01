import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationType } from '@teamhub/shared';
import { NotificationsService } from '../notifications/notifications.service';
import { Task, TaskDocument } from './schemas/task.schema';
import { GatewayGateway } from '../gateway/gateway.gateway';

@Processor('task-reminders')
export class TaskRemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(TaskRemindersProcessor.name);

  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private notificationsService: NotificationsService,
    private gateway: GatewayGateway
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== 'scan-due-tasks') return;

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);

    // 1 hour reminders
    const dueSoon1h = await this.taskModel
      .find({
        dueAt: { $gt: now, $lte: in1h },
        reminder1hSentAt: { $exists: false },
      })
      .select('_id title projectId workspaceId assigneeId watcherIds dueAt')
      .exec();

    // 24 hour reminders (exclude tasks already within 1h window to avoid double-notify)
    const dueSoon24h = await this.taskModel
      .find({
        dueAt: { $gt: in1h, $lte: in24h },
        reminder24hSentAt: { $exists: false },
      })
      .select('_id title projectId workspaceId assigneeId watcherIds dueAt')
      .exec();

    await this.sendDueNotifications(dueSoon1h, '1h');
    await this.sendDueNotifications(dueSoon24h, '24h');

    // Mark reminders as sent
    if (dueSoon1h.length > 0) {
      await this.taskModel
        .updateMany({ _id: { $in: dueSoon1h.map((t) => t._id) } }, { reminder1hSentAt: now })
        .exec();
    }
    if (dueSoon24h.length > 0) {
      await this.taskModel
        .updateMany({ _id: { $in: dueSoon24h.map((t) => t._id) } }, { reminder24hSentAt: now })
        .exec();
    }
  }

  private async sendDueNotifications(tasks: TaskDocument[], window: '1h' | '24h') {
    for (const task of tasks) {
      const recipients = new Set<string>();
      if (task.assigneeId) recipients.add(task.assigneeId);
      for (const watcherId of task.watcherIds || []) recipients.add(watcherId);

      if (recipients.size === 0) continue;

      const link = `/projects/${task.projectId}?taskId=${task._id.toString()}`;
      const title = window === '1h' ? 'Task due within 1 hour' : 'Task due within 24 hours';
      const body = task.title;

      const userIds = Array.from(recipients);
      await this.notificationsService.createForUsers(
        userIds,
        task.workspaceId,
        NotificationType.TASK_DUE_SOON,
        title,
        body,
        link,
        {
          taskId: task._id.toString(),
          projectId: task.projectId,
          dueAt: task.dueAt?.toISOString(),
          window,
        }
      );

      for (const userId of userIds) {
        this.gateway.emitToUser(userId, 'notification:new', {
          type: 'task_due_soon',
          title,
          body,
          link,
        });
      }

      this.logger.log(`Sent ${window} due reminders for task ${task._id.toString()} to ${userIds.length} user(s)`);
    }
  }
}

