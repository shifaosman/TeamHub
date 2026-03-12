import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File, FileDocument } from './schemas/file.schema';
import { FileComment, FileCommentDocument } from './schemas/file-comment.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { StorageService } from './storage/storage.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ChannelsService } from '../channels/channels.service';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@teamhub/shared';

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
    @InjectModel(FileComment.name) private fileCommentModel: Model<FileCommentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private storageService: StorageService,
    private workspacesService: WorkspacesService,
    private channelsService: ChannelsService,
    private activityService: ActivityService,
    private notificationsService: NotificationsService
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    workspaceId: string,
    channelId?: string,
    isPublic = false,
    folderId?: string
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
      folderId,
    });

    const saved = await fileRecord.save();

    await this.activityService.record({
      workspaceId,
      actorId: userId,
      type: 'FILE_UPLOADED',
      entityType: 'file',
      entityId: saved._id.toString(),
      metadata: {
        originalName: saved.originalName,
        channelId: channelId ?? undefined,
      },
    });

    return saved;
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
    options: {
      channelId?: string;
      folderId?: string;
      search?: string;
      mimeType?: string;
      sort?: 'createdAt' | 'updatedAt' | 'originalName' | 'size';
      order?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ files: (FileDocument & { uploader?: UserDocument | null })[]; total: number }> {
    const {
      channelId,
      folderId,
      search,
      mimeType,
      sort = 'createdAt',
      order = 'desc',
      limit = 50,
      offset = 0,
    } = options;

    const workspaceMember = await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const query: Record<string, unknown> = { workspaceId };
    if (channelId) query.channelId = channelId;
    if (folderId !== undefined) query.folderId = folderId || null;
    if (mimeType) {
      if (mimeType === 'image') query.mimeType = { $regex: /^image\// };
      else if (mimeType === 'video') query.mimeType = { $regex: /^video\// };
      else if (mimeType === 'document') {
        query.mimeType = {
          $in: [
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          ],
        };
      } else query.mimeType = mimeType;
    }
    if (search && search.trim()) {
      query.$or = [
        { originalName: { $regex: search.trim(), $options: 'i' } },
        { filename: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const sortKey = sort === 'originalName' ? 'originalName' : sort === 'updatedAt' ? 'updatedAt' : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const [files, total] = await Promise.all([
      this.fileModel
        .find(query)
        .sort({ [sortKey]: sortOrder })
        .limit(limit)
        .skip(offset)
        .lean()
        .exec(),
      this.fileModel.countDocuments(query).exec(),
    ]);

    const uploaderIds = [...new Set((files as FileDocument[]).map((f) => f.uploadedBy?.toString()).filter(Boolean))];
    const users = await this.userModel
      .find({ _id: { $in: uploaderIds } })
      .select('username email firstName lastName avatar')
      .lean()
      .exec();
    const userMap = new Map(users.map((u) => [(u as any)._id.toString(), u]));

    const filesWithUploader = (files as FileDocument[]).map((f) => ({
      ...f,
      uploader: f.uploadedBy ? userMap.get(f.uploadedBy.toString()) ?? null : null,
    }));

    return { files: filesWithUploader as (FileDocument & { uploader?: UserDocument | null })[], total };
  }

  async getFileDetails(
    id: string,
    userId: string
  ): Promise<FileDocument & { uploader?: UserDocument | null; previewUrl?: string }> {
    const file = await this.findOne(id, userId);
    const uploader = file.uploadedBy
      ? await this.userModel
          .findById(file.uploadedBy)
          .select('username email firstName lastName avatar')
          .lean()
          .exec()
      : null;
    const previewUrl = await this.storageService.getSignedUrl(file.storageKey);
    return {
      ...file.toObject(),
      uploader: uploader as UserDocument | null,
      previewUrl,
    } as FileDocument & { uploader?: UserDocument | null; previewUrl?: string };
  }

  async getDownloadUrl(id: string, userId: string): Promise<string> {
    const file = await this.findOne(id, userId);
    return this.storageService.getSignedUrl(file.storageKey);
  }

  async addComment(
    fileId: string,
    userId: string,
    content: string
  ): Promise<FileCommentDocument> {
    const file = await this.findOne(fileId, userId);
    const comment = new this.fileCommentModel({ fileId, userId, content });
    const saved = await comment.save();

    // Notify file owner if commenter is not the owner
    const ownerId = file.uploadedBy?.toString();
    if (ownerId && ownerId !== userId) {
      const link = `/workspaces/${file.workspaceId}/files?fileId=${fileId}`;
      await this.notificationsService.create({
        userId: ownerId,
        workspaceId: file.workspaceId,
        type: NotificationType.FILE_COMMENT,
        title: 'New comment on file',
        body: content.slice(0, 80) + (content.length > 80 ? '…' : ''),
        link,
        entityType: 'file',
        entityId: fileId,
        metadata: { fileId, commentId: saved._id.toString(), originalName: file.originalName },
      });
    }

    return saved;
  }

  async getComments(
    fileId: string,
    userId: string
  ): Promise<(FileCommentDocument & { user?: UserDocument | null })[]> {
    await this.findOne(fileId, userId);
    const comments = await this.fileCommentModel
      .find({ fileId })
      .sort({ createdAt: 1 })
      .lean()
      .exec();
    const userIds = [...new Set((comments as any[]).map((c) => c.userId).filter(Boolean))];
    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('username firstName lastName avatar')
      .lean()
      .exec();
    const userMap = new Map(users.map((u) => [(u as any)._id.toString(), u]));
    return (comments as any[]).map((c) => ({
      ...c,
      user: c.userId ? userMap.get(c.userId.toString()) ?? null : null,
    }));
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
