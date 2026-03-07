import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Message, MessageSchema } from '../messages/schemas/message.schema';
import { Channel, ChannelSchema } from '../channels/schemas/channel.schema';
import { Note, NoteSchema } from '../notes/schemas/note.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';
import { File, FileSchema } from '../files/schemas/file.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Channel.name, schema: ChannelSchema },
      { name: Note.name, schema: NoteSchema },
      { name: Task.name, schema: TaskSchema },
      { name: File.name, schema: FileSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    WorkspacesModule,
  ],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
