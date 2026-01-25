import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchMessagesDto } from '../messages/dto/search-messages.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('messages')
  @ApiOperation({ summary: 'Search messages with filters' })
  searchMessages(@CurrentUser() user: any, @Body() searchDto: SearchMessagesDto) {
    return this.searchService.searchMessages(searchDto, user.userId);
  }

  @Get('channels')
  @ApiOperation({ summary: 'Search channels' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'query', required: true })
  searchChannels(
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId: string,
    @Query('query') query: string
  ) {
    return this.searchService.searchChannels(workspaceId, user.userId, query);
  }

  @Get('users')
  @ApiOperation({ summary: 'Search users in workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'query', required: true })
  searchUsers(
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId: string,
    @Query('query') query: string
  ) {
    return this.searchService.searchUsers(workspaceId, user.userId, query);
  }

  @Get('global')
  @ApiOperation({ summary: 'Global search (messages, channels, users)' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  globalSearch(
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId: string,
    @Query('query') query: string,
    @Query('limit') limit?: number
  ) {
    return this.searchService.globalSearch(workspaceId, user.userId, query, limit || 20);
  }
}
