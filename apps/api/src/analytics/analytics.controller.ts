import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnalyticsService, AnalyticsPeriod, WorkspaceAnalytics } from './analytics.service';

@ApiTags('analytics')
@Controller('workspaces/:workspaceId/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get workspace analytics dashboard data' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d'], description: 'Time range for time-series metrics' })
  getWorkspaceAnalytics(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: { userId: string },
    @Query('period') period?: AnalyticsPeriod,
  ): Promise<WorkspaceAnalytics> {
    return this.analyticsService.getWorkspaceAnalytics(
      workspaceId,
      user.userId,
      period && ['7d', '30d', '90d'].includes(period) ? period : '30d',
    );
  }
}
