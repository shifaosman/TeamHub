import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { Channel, ChannelSchema } from './schemas/channel.schema';
import { ChannelMember, ChannelMemberSchema } from './schemas/channel-member.schema';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Channel.name, schema: ChannelSchema },
      { name: ChannelMember.name, schema: ChannelMemberSchema },
    ]),
    WorkspacesModule,
    ActivityModule,
  ],
  providers: [ChannelsService],
  controllers: [ChannelsController],
  exports: [ChannelsService],
})
export class ChannelsModule {}
