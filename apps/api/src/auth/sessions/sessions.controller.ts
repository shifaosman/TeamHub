import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth/sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active sessions for current user' })
  findAll(@CurrentUser() user: any) {
    return this.sessionsService.findByUserId(user.userId);
  }

  @Delete('all')
  @ApiOperation({ summary: 'Revoke all sessions for current user' })
  revokeAll(@CurrentUser() user: any) {
    return this.sessionsService.revokeAll(user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a specific session' })
  revoke(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sessionsService.revokeById(id, user.userId);
  }
}
