import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@Controller('comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  create(@CurrentUser() user: any, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List comments for a task' })
  @ApiQuery({ name: 'taskId', required: true })
  list(@CurrentUser() user: any, @Query('taskId') taskId: string) {
    return this.commentsService.findByTask(taskId, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete comment (creator or workspace admin/owner)' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.commentsService.delete(id, user.userId);
  }
}

