import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notes')
@Controller('notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  create(@CurrentUser() user: any, @Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create(user.userId, createNoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get notes in workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'parentId', required: false })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  findAll(
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId: string,
    @Query('parentId') parentId?: string,
    @Query('includeArchived') includeArchived?: boolean
  ) {
    return this.notesService.findAll(workspaceId, user.userId, parentId, includeArchived === true);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get note by ID' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notesService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdateNoteDto
  ) {
    return this.notesService.update(id, user.userId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete note (archive)' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notesService.delete(id, user.userId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get note version history' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  getVersions(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notesService.getVersions(id, user.userId);
  }

  @Post(':id/versions/:versionId/restore')
  @ApiOperation({ summary: 'Restore note to a previous version' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiParam({ name: 'versionId', description: 'Version ID' })
  restoreVersion(
    @Param('id') noteId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: any
  ) {
    return this.notesService.restoreVersion(noteId, versionId, user.userId);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  addComment(
    @Param('id') noteId: string,
    @CurrentUser() user: any,
    @Body() createCommentDto: CreateCommentDto
  ) {
    return this.notesService.addComment(noteId, user.userId, createCommentDto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get note comments' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  getComments(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notesService.getComments(id, user.userId);
  }

  @Patch(':id/comments/:commentId')
  @ApiOperation({ summary: 'Update comment' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  updateComment(
    @Param('id') noteId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: any,
    @Body() body: { content: string }
  ) {
    return this.notesService.updateComment(noteId, commentId, user.userId, body.content);
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Delete comment' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  deleteComment(
    @Param('id') noteId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: any
  ) {
    return this.notesService.deleteComment(noteId, commentId, user.userId);
  }

  @Post(':id/collaborators')
  @ApiOperation({ summary: 'Add collaborator to note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  addCollaborator(
    @Param('id') noteId: string,
    @CurrentUser() user: any,
    @Body() body: { userId: string; permission: 'read' | 'write' | 'admin' }
  ) {
    return this.notesService.addCollaborator(noteId, user.userId, body.userId, body.permission);
  }

  @Get(':id/collaborators')
  @ApiOperation({ summary: 'Get note collaborators' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  getCollaborators(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notesService.getCollaborators(id, user.userId);
  }

  @Delete(':id/collaborators/:userId')
  @ApiOperation({ summary: 'Remove collaborator from note' })
  @ApiParam({ name: 'id', description: 'Note ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  removeCollaborator(
    @Param('id') noteId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: any
  ) {
    return this.notesService.removeCollaborator(noteId, user.userId, targetUserId);
  }
}
