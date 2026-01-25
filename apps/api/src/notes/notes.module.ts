import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { Note, NoteSchema } from './schemas/note.schema';
import { NoteVersion, NoteVersionSchema } from './schemas/note-version.schema';
import { NoteComment, NoteCommentSchema } from './schemas/note-comment.schema';
import { NoteCollaborator, NoteCollaboratorSchema } from './schemas/note-collaborator.schema';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Note.name, schema: NoteSchema },
      { name: NoteVersion.name, schema: NoteVersionSchema },
      { name: NoteComment.name, schema: NoteCommentSchema },
      { name: NoteCollaborator.name, schema: NoteCollaboratorSchema },
    ]),
    WorkspacesModule,
  ],
  providers: [NotesService],
  controllers: [NotesController],
  exports: [NotesService],
})
export class NotesModule {}
