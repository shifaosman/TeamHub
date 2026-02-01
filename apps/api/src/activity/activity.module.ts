import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { Activity, ActivitySchema } from './schemas/activity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    WorkspacesModule,
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}

