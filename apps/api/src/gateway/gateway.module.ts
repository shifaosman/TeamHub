import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { GatewayGateway } from './gateway.gateway';
import { MessagesModule } from '../messages/messages.module';
import { ChannelsModule } from '../channels/channels.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    JwtModule.register({}),
    ConfigModule,
    MessagesModule,
    ChannelsModule,
    NotificationsModule,
    RedisModule,
  ],
  providers: [GatewayGateway],
  exports: [GatewayGateway],
})
export class GatewayModule {}
