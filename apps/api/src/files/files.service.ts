import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File, FileDocument } from './schemas/file.schema';
import { StorageService } from './storage/storage.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ChannelsService } from '../channels/channels.service';

@Injectable()
export class FilesService {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
  ];

  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    private storageService: StorageService,
    private workspacesService: WorkspacesService,
    private channelsService: ChannelsService
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    workspaceId: string,
    channelId?: string,
    isPublic = false
  ): Promise<FileDocument> {
    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds maximum of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validate MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    // Verify workspace access
    const workspaceMember = await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Verify channel access if channelId is provided
    if (channelId) {
      await this.channelsService.findOne(channelId, userId);
    }

    // Upload to storage
    const { storageKey, storageUrl } = await this.storageService.uploadFile(
      file,
      workspaceId,
      channelId
    );

    // Create file record
    const fileRecord = new this.fileModel({
      workspaceId,
      channelId,
      uploadedBy: userId,
      filename: file.filename || storageKey,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey,
      storageUrl,
      isPublic,
    });

    return fileRecord.save();
  }

  async findOne(id: string, userId: string): Promise<FileDocument> {
    const file = await this.fileModel.findById(id).exec();
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    // Verify access
    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      file.workspaceId,
      userId
    );
    if (!workspaceMember && !file.isPublic) {
      throw new ForbiddenException('You do not have access to this file');
    }

    return file;
  }

  async findAll(
    workspaceId: string,
    userId: string,
    channelId?: string,
    limit = 50,
    offset = 0
  ): Promise<{ files: FileDocument[]; total: number }> {
    // Verify workspace access
    const workspaceMember = await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const query: any = { workspaceId };
    if (channelId) {
      query.channelId = channelId;
    }

    const [files, total] = await Promise.all([
      this.fileModel
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .populate('uploadedBy', 'username email firstName lastName avatar')
        .exec(),
      this.fileModel.countDocuments(query).exec(),
    ]);

    return { files, total };
  }

  async getDownloadUrl(id: string, userId: string): Promise<string> {
    const file = await this.findOne(id, userId);
    return this.storageService.getSignedUrl(file.storageKey);
  }

  async delete(id: string, userId: string): Promise<void> {
    const file = await this.findOne(id, userId);

    // Only file uploader or workspace admin/owner can delete
    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      file.workspaceId,
      userId
    );

    const canDelete =
      file.uploadedBy.toString() === userId ||
      workspaceMember?.role === 'owner' ||
      workspaceMember?.role === 'admin';

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    // Delete from storage
    await this.storageService.deleteFile(file.storageKey);

    // Delete record
    await this.fileModel.findByIdAndDelete(id).exec();
  }

  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
  }

  isAudio(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
  }

  isDocument(mimeType: string): boolean {
    return (
      mimeType.includes('pdf') ||
      mimeType.includes('word') ||
      mimeType.includes('excel') ||
      mimeType.includes('powerpoint') ||
      mimeType.includes('text')
    );
  }
}
