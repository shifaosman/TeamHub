import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActivityService } from './activity.service';
import { ActivityEntityType } from './schemas/activity.schema';

@ApiTags('activity')
@Controller('activity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'Get activity feed (workspace/project/task)' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'taskId', required: false })
  @ApiQuery({ name: 'entityType', required: false, enum: ['project', 'task', 'note', 'message', 'file', 'workspace', 'channel'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  list(
    @CurrentUser() user: { userId: string },
    @Query('workspaceId') workspaceId?: string,
    @Query('projectId') projectId?: string,
    @Query('taskId') taskId?: string,
    @Query('entityType') entityType?: ActivityEntityType,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.activityService.list({
      userId: user.userId,
      workspaceId,
      projectId,
      taskId,
      entityType,
      limit,
      offset,
    });
  }
}

