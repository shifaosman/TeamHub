import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Message, MessageSchema } from './schemas/message.schema';
import { MessageEditHistory, MessageEditHistorySchema } from './schemas/message-edit-history.schema';
import { Bookmark, BookmarkSchema } from './schemas/bookmark.schema';
import { ChannelsModule } from '../channels/channels.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: MessageEditHistory.name, schema: MessageEditHistorySchema },
      { name: Bookmark.name, schema: BookmarkSchema },
    ]),
    ChannelsModule,
    NotificationsModule,
  ],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
