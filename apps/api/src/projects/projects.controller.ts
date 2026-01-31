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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-project-member-role.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  create(@CurrentUser() user: any, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List projects in a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  list(@CurrentUser() user: any, @Query('workspaceId') workspaceId: string) {
    return this.projectsService.findAll(workspaceId, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.projectsService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, user.userId, dto);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  addMember(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: AddProjectMemberDto) {
    return this.projectsService.addMember(id, user.userId, dto);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Update project member role' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  updateMemberRole(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateProjectMemberRoleDto
  ) {
    return this.projectsService.updateMemberRole(id, targetUserId, user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project (workspace admin/owner only)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.projectsService.delete(id, user.userId);
  }
}

