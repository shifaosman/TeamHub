import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from '../messages/messages.service';
import { ChannelsService } from '../channels/channels.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Inject, Optional } from '@nestjs/common';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  workspaceId?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class GatewayGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GatewayGateway.name);
  private readonly connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private readonly userPresence = new Map<string, { status: string; lastSeen: Date }>(); // userId -> presence

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private messagesService: MessagesService,
    private channelsService: ChannelsService,
    @Optional() private notificationsService?: NotificationsService
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Authenticate via JWT from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.userId = payload.sub;
      client.join(`user:${client.userId}`);

      // Track connection
      if (!this.connectedUsers.has(client.userId)) {
        this.connectedUsers.set(client.userId, new Set());
      }
      this.connectedUsers.get(client.userId)!.add(client.id);

      // Update presence
      this.userPresence.set(client.userId, {
        status: 'online',
        lastSeen: new Date(),
      });

      // Broadcast presence update
      this.server.emit('presence:update', {
        userId: client.userId,
        status: 'online',
      });

      this.logger.log(`Client ${client.id} connected as user ${client.userId}`);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.connectedUsers.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(client.userId);
          this.userPresence.set(client.userId, {
            status: 'offline',
            lastSeen: new Date(),
          });

          // Broadcast presence update
          this.server.emit('presence:update', {
            userId: client.userId,
            status: 'offline',
          });
        }
      }
    }
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join:workspace')
  async handleJoinWorkspace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { workspaceId: string }
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    client.workspaceId = data.workspaceId;
    client.join(`workspace:${data.workspaceId}`);
    client.join(`user:${client.userId}`);

    return { success: true, workspaceId: data.workspaceId };
  }

  @SubscribeMessage('join:channel')
  async handleJoinChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string }
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      // Verify channel access
      await this.channelsService.findOne(data.channelId, client.userId);
      client.join(`channel:${data.channelId}`);
      return { success: true, channelId: data.channelId };
    } catch (error) {
      return { error: 'Access denied' };
    }
  }

  @SubscribeMessage('leave:channel')
  async handleLeaveChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string }
  ) {
    client.leave(`channel:${data.channelId}`);
    return { success: true };
  }

  @SubscribeMessage('message:typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string; threadId?: string }
  ) {
    if (!client.userId) {
      return;
    }

    // Broadcast typing indicator to channel (excluding sender)
    client.to(`channel:${data.channelId}`).emit('message:typing', {
      channelId: data.channelId,
      threadId: data.threadId,
      userId: client.userId,
      isTyping: true,
    });

    // Stop typing after 3 seconds
    setTimeout(() => {
      client.to(`channel:${data.channelId}`).emit('message:typing', {
        channelId: data.channelId,
        threadId: data.threadId,
        userId: client.userId,
        isTyping: false,
      });
    }, 3000);
  }

  @SubscribeMessage('message:create')
  async handleMessageCreate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { channelId: string; content: string; threadId?: string; replyToId?: string }
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const message = await this.messagesService.create(client.userId, {
        channelId: data.channelId,
        content: data.content,
        threadId: data.threadId,
        replyToId: data.replyToId,
      });

      // Broadcast to channel
      this.server.to(`channel:${data.channelId}`).emit('message:new', message);

      // Emit notification event to affected users
      if (this.notificationsService) {
        try {
          const channelMembers = await this.channelsService.getChannelMembers(data.channelId);
          const memberIds = channelMembers
            .map((m) => {
              // Handle both populated and non-populated userId
              const userIdValue = typeof m.userId === 'object' && m.userId?._id
                ? m.userId._id.toString()
                : m.userId.toString();
              return userIdValue;
            })
            .filter((id) => id !== client.userId);

          for (const memberId of memberIds) {
            this.emitToUser(memberId, 'notification:new', {
              type: message.mentions.includes(memberId) ? 'mention' : 'message',
              title: message.mentions.includes(memberId)
                ? `You were mentioned in #${channel.name}`
                : `New message in #${channel.name}`,
              body: message.content.substring(0, 100),
              link: `/channels/${data.channelId}`,
            });
          }
        } catch (error) {
          this.logger.error('Error emitting notifications:', error);
        }
      }

      // Update unread counts for channel members
      this.updateUnreadCounts(data.channelId);

      return { success: true, message };
    } catch (error: any) {
      this.logger.error('Error creating message:', error);
      return { error: error.message };
    }
  }

  @SubscribeMessage('message:update')
  async handleMessageUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; content: string }
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const message = await this.messagesService.update(
        data.messageId,
        client.userId,
        { content: data.content }
      );

      // Broadcast update to channel
      this.server.to(`channel:${message.channelId}`).emit('message:updated', message);

      return { success: true, message };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('message:delete')
  async handleMessageDelete(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string }
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const message = await this.messagesService.findOne(data.messageId, client.userId);
      await this.messagesService.delete(data.messageId, client.userId);

      // Broadcast deletion to channel
      this.server.to(`channel:${message.channelId}`).emit('message:deleted', {
        messageId: data.messageId,
        channelId: message.channelId,
      });

      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('message:reaction')
  async handleReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; emoji: string }
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    try {
      const message = await this.messagesService.addReaction(
        data.messageId,
        client.userId,
        { emoji: data.emoji }
      );

      // Broadcast reaction update to channel
      this.server.to(`channel:${message.channelId}`).emit('message:reaction', message);

      return { success: true, message };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('presence:update')
  async handlePresenceUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { status: string }
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    this.userPresence.set(client.userId, {
      status: data.status,
      lastSeen: new Date(),
    });

    // Broadcast presence update
    this.server.emit('presence:update', {
      userId: client.userId,
      status: data.status,
    });

    return { success: true };
  }

  @SubscribeMessage('note:join')
  async handleJoinNote(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { noteId: string }
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    client.join(`note:${data.noteId}`);
    return { success: true, noteId: data.noteId };
  }

  @SubscribeMessage('note:leave')
  async handleLeaveNote(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { noteId: string }
  ) {
    client.leave(`note:${data.noteId}`);
    return { success: true };
  }

  @SubscribeMessage('note:update')
  async handleNoteUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { noteId: string; title?: string; content?: string }
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    // Broadcast update to other users in the note room (excluding sender)
    client.to(`note:${data.noteId}`).emit('note:updated', {
      noteId: data.noteId,
      title: data.title,
      content: data.content,
      updatedBy: client.userId,
      updatedAt: new Date(),
    });

    return { success: true };
  }

  @SubscribeMessage('note:cursor')
  async handleNoteCursor(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { noteId: string; position: number; selection?: { start: number; end: number } }
  ) {
    if (!client.userId) {
      return { error: 'Not authenticated' };
    }

    // Broadcast cursor position to other users in the note room (excluding sender)
    client.to(`note:${data.noteId}`).emit('note:cursor', {
      noteId: data.noteId,
      userId: client.userId,
      position: data.position,
      selection: data.selection,
    });

    return { success: true };
  }

  private async updateUnreadCounts(channelId: string) {
    // This would update unread counts for all channel members
    // For now, we'll emit an event that clients can listen to
    this.server.to(`channel:${channelId}`).emit('unread:update', { channelId });
  }

  // Helper method to emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Helper method to emit to workspace
  emitToWorkspace(workspaceId: string, event: string, data: any) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }

  // Helper method to emit to channel
  emitToChannel(channelId: string, event: string, data: any) {
    this.server.to(`channel:${channelId}`).emit(event, data);
  }
}
