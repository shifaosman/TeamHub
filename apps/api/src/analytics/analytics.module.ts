import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { Channel, ChannelSchema } from '../channels/schemas/channel.schema';
import { Message, MessageSchema } from '../messages/schemas/message.schema';
import { Note, NoteSchema } from '../notes/schemas/note.schema';
import { File, FileSchema } from '../files/schemas/file.schema';
import { WorkspaceMember, WorkspaceMemberSchema } from '../workspaces/schemas/workspace-member.schema';
import { Activity, ActivitySchema } from '../activity/schemas/activity.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Channel.name, schema: ChannelSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Note.name, schema: NoteSchema },
      { name: File.name, schema: FileSchema },
      { name: WorkspaceMember.name, schema: WorkspaceMemberSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: User.name, schema: UserSchema },
    ]),
    WorkspacesModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
