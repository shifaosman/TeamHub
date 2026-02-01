import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateTaskFromMessageDto } from './dto/create-task-from-message.dto';
import { ReorderTasksDto } from './dto/reorder-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskAssigneeDto } from './dto/update-task-assignee.dto';
import { UpdateTaskDueDto } from './dto/update-task-due.dto';
import { UpdateTaskWatchersDto } from './dto/update-task-watchers.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  create(@CurrentUser() user: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.userId, dto);
  }

  @Post('from-message')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a task from a message' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  createFromMessage(@CurrentUser() user: any, @Body() dto: CreateTaskFromMessageDto) {
    return this.tasksService.createFromMessage(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tasks in a project' })
  @ApiQuery({ name: 'projectId', required: true })
  @ApiQuery({ name: 'status', required: false, enum: ['todo', 'in-progress', 'done'] })
  @ApiQuery({ name: 'assigneeId', required: false })
  list(
    @CurrentUser() user: any,
    @Query('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string
  ) {
    return this.tasksService.findAll({ projectId, userId: user.userId, status, assigneeId });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, user.userId, dto);
  }

  @Patch(':id/assignee')
  @ApiOperation({ summary: 'Update task assignee' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  updateAssignee(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateTaskAssigneeDto
  ) {
    return this.tasksService.updateAssignee(id, user.userId, dto);
  }

  @Patch(':id/watchers')
  @ApiOperation({ summary: 'Update task watchers' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  updateWatchers(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateTaskWatchersDto
  ) {
    return this.tasksService.updateWatchers(id, user.userId, dto);
  }

  @Patch(':id/due')
  @ApiOperation({ summary: 'Update task due date' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  updateDue(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateTaskDueDto) {
    return this.tasksService.updateDue(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task (creator or workspace admin/owner)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.delete(id, user.userId);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder tasks (drag & drop)' })
  reorder(@CurrentUser() user: any, @Body() dto: ReorderTasksDto) {
    return this.tasksService.reorder(user.userId, dto);
  }
}

