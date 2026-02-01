import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ActivityModule } from '../activity/activity.module';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment, CommentSchema } from './schemas/comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    WorkspacesModule,
    ActivityModule,
  ],
  providers: [CommentsService],
  controllers: [CommentsController],
  exports: [CommentsService],
})
export class CommentsModule {}

