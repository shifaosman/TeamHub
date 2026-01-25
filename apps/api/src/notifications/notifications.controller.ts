import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findAll(
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.notificationsService.findAll(
      user.userId,
      workspaceId,
      limit || 50,
      offset || 0
    );
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiQuery({ name: 'workspaceId', required: false })
  async getUnreadCount(@CurrentUser() user: any, @Query('workspaceId') workspaceId?: string) {
    const count = await this.notificationsService.findUnreadCount(user.userId, workspaceId);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(id, user.userId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiQuery({ name: 'workspaceId', required: false })
  markAllAsRead(@CurrentUser() user: any, @Query('workspaceId') workspaceId?: string) {
    return this.notificationsService.markAllAsRead(user.userId, workspaceId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.delete(id, user.userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'channelId', required: false })
  getPreferences(
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId?: string,
    @Query('channelId') channelId?: string
  ) {
    return this.notificationsService.getUserPreference(user.userId, workspaceId, channelId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'channelId', required: false })
  updatePreferences(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateNotificationPreferenceDto,
    @Query('workspaceId') workspaceId?: string,
    @Query('channelId') channelId?: string
  ) {
    return this.notificationsService.updatePreference(
      user.userId,
      updateDto,
      workspaceId,
      channelId
    );
  }
}
