import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { MessagesModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GatewayModule } from '../gateway/gateway.module';
import { ActivityModule } from '../activity/activity.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task, TaskSchema } from './schemas/task.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema';
import { TaskRemindersProcessor } from './task-reminders.processor';
import { TaskRemindersService } from './task-reminders.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
    BullModule.registerQueue({ name: 'task-reminders' }),
    WorkspacesModule,
    MessagesModule,
    NotificationsModule,
    GatewayModule,
    ActivityModule,
  ],
  providers: [TasksService, TaskRemindersService, TaskRemindersProcessor],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}

