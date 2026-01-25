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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { AddReactionDto } from './dto/add-reaction.dto';
import { SearchMessagesDto } from './dto/search-messages.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new message' })
  create(@CurrentUser() user: any, @Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(user.userId, createMessageDto);
  }

  @Get('channel/:channelId')
  @ApiOperation({ summary: 'Get messages in a channel' })
  @ApiParam({ name: 'channelId', description: 'Channel ID' })
  findAll(
    @Param('channelId') channelId: string,
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('before') before?: string
  ) {
    return this.messagesService.findAll(channelId, user.userId, limit || 50, before);
  }

  @Get('thread/:threadId')
  @ApiOperation({ summary: 'Get thread messages' })
  @ApiParam({ name: 'threadId', description: 'Thread/Message ID' })
  getThread(@Param('threadId') threadId: string, @CurrentUser() user: any) {
    return this.messagesService.findThreadMessages(threadId, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message by ID' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdateMessageDto
  ) {
    return this.messagesService.update(id, user.userId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.delete(id, user.userId);
  }

  @Post(':id/reactions')
  @ApiOperation({ summary: 'Add or toggle reaction on message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  addReaction(
    @Param('id') messageId: string,
    @CurrentUser() user: any,
    @Body() reactionDto: AddReactionDto
  ) {
    return this.messagesService.addReaction(messageId, user.userId, reactionDto);
  }

  @Post(':id/pin')
  @ApiOperation({ summary: 'Pin message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  pinMessage(@Param('id') messageId: string, @CurrentUser() user: any) {
    return this.messagesService.pinMessage(messageId, user.userId);
  }

  @Delete(':id/pin')
  @ApiOperation({ summary: 'Unpin message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  unpinMessage(@Param('id') messageId: string, @CurrentUser() user: any) {
    return this.messagesService.unpinMessage(messageId, user.userId);
  }

  @Get('channel/:channelId/pinned')
  @ApiOperation({ summary: 'Get pinned messages in channel' })
  @ApiParam({ name: 'channelId', description: 'Channel ID' })
  getPinnedMessages(@Param('channelId') channelId: string, @CurrentUser() user: any) {
    return this.messagesService.getPinnedMessages(channelId, user.userId);
  }

  @Post(':id/bookmark')
  @ApiOperation({ summary: 'Bookmark message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  bookmarkMessage(@Param('id') messageId: string, @CurrentUser() user: any) {
    return this.messagesService.bookmarkMessage(messageId, user.userId);
  }

  @Delete(':id/bookmark')
  @ApiOperation({ summary: 'Unbookmark message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  unbookmarkMessage(@Param('id') messageId: string, @CurrentUser() user: any) {
    return this.messagesService.unbookmarkMessage(messageId, user.userId);
  }

  @Get('bookmarks/me')
  @ApiOperation({ summary: 'Get user bookmarks' })
  getUserBookmarks(@CurrentUser() user: any) {
    return this.messagesService.getUserBookmarks(user.userId);
  }

  @Get('channel/:channelId/unread')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiParam({ name: 'channelId', description: 'Channel ID' })
  getUnreadCount(@Param('channelId') channelId: string, @CurrentUser() user: any) {
    return this.messagesService.getUnreadCount(channelId, user.userId);
  }

  @Post('search')
  @ApiOperation({ summary: 'Search messages' })
  search(@CurrentUser() user: any, @Body() searchDto: SearchMessagesDto) {
    return this.messagesService.search(searchDto, user.userId);
  }
}
