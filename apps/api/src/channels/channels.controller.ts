import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { AddChannelMembersDto } from './dto/add-members.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('channels')
@Controller('channels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new channel' })
  @ApiResponse({ status: 201, description: 'Channel created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@CurrentUser() user: any, @Body() createChannelDto: CreateChannelDto) {
    return this.channelsService.create(user.userId, createChannelDto);
  }

  @Get('workspace/:workspaceId')
  @ApiOperation({ summary: 'Get all channels in a workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  findAll(@Param('workspaceId') workspaceId: string, @CurrentUser() user: any) {
    return this.channelsService.findAll(workspaceId, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get channel by ID' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.channelsService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update channel' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdateChannelDto
  ) {
    return this.channelsService.update(id, user.userId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete channel' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.channelsService.delete(id, user.userId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add members to channel' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  addMembers(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() addMembersDto: AddChannelMembersDto
  ) {
    return this.channelsService.addMembers(id, user.userId, addMembersDto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get channel members' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  getMembers(@Param('id') id: string) {
    return this.channelsService.getChannelMembers(id);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from channel' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  removeMember(
    @Param('id') channelId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: any
  ) {
    return this.channelsService.removeMember(channelId, targetUserId, user.userId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark channel as read' })
  @ApiParam({ name: 'id', description: 'Channel ID' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.channelsService.updateLastRead(id, user.userId);
  }
}
