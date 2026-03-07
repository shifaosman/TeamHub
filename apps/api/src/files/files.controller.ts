import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
  BadRequestException,
  Req,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { CreateFileCommentDto } from './dto/create-file-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Response } from 'express';
import { StorageService } from './storage/storage.service';

@ApiTags('files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly storageService: StorageService
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        workspaceId: {
          type: 'string',
        },
        channelId: {
          type: 'string',
        },
        isPublic: {
          type: 'boolean',
        },
      },
      required: ['workspaceId'],
    },
  })
  @UsePipes(new ValidationPipe({ skipMissingProperties: true, whitelist: false }))
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Req() req: Request & { body: { workspaceId?: string; channelId?: string; isPublic?: string } }
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Read form data from request body (multipart/form-data fields are parsed by multer)
    const workspaceId = req.body?.workspaceId;
    const channelId = req.body?.channelId;
    const isPublic = req.body?.isPublic;
    const folderId = req.body?.folderId;

    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    const isPublicBool = isPublic === 'true' || isPublic === '1' || isPublic === true;

    return this.filesService.uploadFile(
      file,
      user.userId,
      workspaceId,
      channelId,
      isPublicBool,
      folderId || undefined
    );
  }

  @Get()
  @ApiOperation({ summary: 'List/search files in workspace' })
  findAll(
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId: string,
    @Query('channelId') channelId?: string,
    @Query('folderId') folderId?: string,
    @Query('search') search?: string,
    @Query('mimeType') mimeType?: string,
    @Query('sort') sort?: 'createdAt' | 'updatedAt' | 'originalName' | 'size',
    @Query('order') order?: 'asc' | 'desc',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.filesService.findAll(workspaceId, user.userId, {
      channelId,
      folderId,
      search,
      mimeType,
      sort,
      order,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get file details with uploader and preview URL' })
  @ApiParam({ name: 'id', description: 'File ID' })
  getFileDetails(@Param('id') id: string, @CurrentUser() user: any) {
    return this.filesService.getFileDetails(id, user.userId);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'List file comments' })
  @ApiParam({ name: 'id', description: 'File ID' })
  getFileComments(@Param('id') id: string, @CurrentUser() user: any) {
    return this.filesService.getComments(id, user.userId);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  addFileComment(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateFileCommentDto
  ) {
    return this.filesService.addComment(id, user.userId, dto.content);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async downloadFile(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const file = await this.filesService.findOne(id, user.userId);
    const downloadUrl = await this.filesService.getDownloadUrl(id, user.userId);

    // If using local storage, stream the file
    if (downloadUrl.startsWith('/uploads/')) {
      const stream = await this.storageService.getFileStream(file.storageKey);
      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
      });
      // Convert NodeJS.ReadableStream to Node.js Readable if needed
      return new StreamableFile(stream as any);
    }

    // For S3, redirect to signed URL
    return res.redirect(downloadUrl);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Get file preview URL' })
  @ApiParam({ name: 'id', description: 'File ID' })
  async getPreviewUrl(@Param('id') id: string, @CurrentUser() user: any) {
    const file = await this.filesService.findOne(id, user.userId);
    const previewUrl = await this.filesService.getDownloadUrl(id, user.userId);
    return {
      url: previewUrl,
      mimeType: file.mimeType,
      isImage: this.filesService.isImage(file.mimeType),
      isVideo: this.filesService.isVideo(file.mimeType),
      isAudio: this.filesService.isAudio(file.mimeType),
      isDocument: this.filesService.isDocument(file.mimeType),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.filesService.findOne(id, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.filesService.delete(id, user.userId);
  }
}
