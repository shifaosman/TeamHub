import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
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
          required: false,
        },
        isPublic: {
          type: 'boolean',
          required: false,
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Query() uploadDto: UploadFileDto
  ) {
    if (!file) {
      throw new Error('No file provided');
    }

    return this.filesService.uploadFile(
      file,
      user.userId,
      uploadDto.workspaceId,
      uploadDto.channelId,
      uploadDto.isPublic || false
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get files in workspace/channel' })
  @ApiParam({ name: 'workspaceId', required: true })
  @ApiParam({ name: 'channelId', required: false })
  findAll(
    @CurrentUser() user: any,
    @Query('workspaceId') workspaceId: string,
    @Query('channelId') channelId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    return this.filesService.findAll(workspaceId, user.userId, channelId, limit || 50, offset || 0);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiParam({ name: 'id', description: 'File ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.filesService.findOne(id, user.userId);
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
      return new StreamableFile(stream);
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete file' })
  @ApiParam({ name: 'id', description: 'File ID' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.filesService.delete(id, user.userId);
  }
}
