import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { File, FileSchema } from './schemas/file.schema';
import { StorageService } from './storage/storage.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ChannelsModule } from '../channels/channels.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    WorkspacesModule,
    ChannelsModule,
  ],
  providers: [FilesService, StorageService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
