import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { File, FileSchema } from './schemas/file.schema';
import { FileComment, FileCommentSchema } from './schemas/file-comment.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { StorageService } from './storage/storage.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ChannelsModule } from '../channels/channels.module';
import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: FileComment.name, schema: FileCommentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    WorkspacesModule,
    ChannelsModule,
    ActivityModule,
    NotificationsModule,
  ],
  providers: [FilesService, StorageService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
