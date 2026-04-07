import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OversightService } from './oversight.service';

@ApiTags('oversight')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class OversightController {
  constructor(private readonly oversightService: OversightService) {}

  @Get('/supervisor/teams')
  getSupervisorTeams(@CurrentUser() user: any) {
    return this.oversightService.getSupervisorTeams(user.userId);
  }

  @Get('/supervisor/team/:id/stats')
  getSupervisorTeamStats(@CurrentUser() user: any, @Param('id') teamId: string) {
    return this.oversightService.getSupervisorTeamStats(user.userId, teamId);
  }

  @Get('/hr/reports')
  getHrReports(@CurrentUser() user: any) {
    return this.oversightService.getHrReports(user.userId);
  }

  @Get('/hr/workload')
  getHrWorkload(@CurrentUser() user: any) {
    return this.oversightService.getHrWorkload(user.userId);
  }
}
