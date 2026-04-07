import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { WorkspaceMember, WorkspaceMemberSchema } from '../workspaces/schemas/workspace-member.schema';
import { Report, ReportSchema } from '../reports/schemas/report.schema';
import { OversightController } from './oversight.controller';
import { OversightService } from './oversight.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: WorkspaceMember.name, schema: WorkspaceMemberSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
    WorkspacesModule,
    NotificationsModule,
  ],
  controllers: [OversightController],
  providers: [OversightService],
})
export class OversightModule {}
