import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class TaskRemindersService implements OnModuleInit {
  private readonly logger = new Logger(TaskRemindersService.name);

  constructor(@InjectQueue('task-reminders') private remindersQueue: Queue) {}

  async onModuleInit() {
    // Add a repeatable job to scan for due tasks every 15 minutes.
    // This is intentionally simple (in-app notifications first).
    try {
      await this.remindersQueue.add(
        'scan-due-tasks',
        {},
        {
          repeat: { every: 15 * 60 * 1000 },
          removeOnComplete: true,
          removeOnFail: true,
        }
      );
      this.logger.log('Scheduled task reminder scan job (every 15 minutes)');
    } catch (e: any) {
      this.logger.error('Failed to schedule task reminder scan job', e);
    }
  }
}

