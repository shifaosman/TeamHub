import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Note, NoteDocument } from './schemas/note.schema';
import { NoteVersion, NoteVersionDocument } from './schemas/note-version.schema';
import { NoteComment, NoteCommentDocument } from './schemas/note-comment.schema';
import { NoteCollaborator, NoteCollaboratorDocument } from './schemas/note-collaborator.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
    @InjectModel(NoteVersion.name) private noteVersionModel: Model<NoteVersionDocument>,
    @InjectModel(NoteComment.name) private noteCommentModel: Model<NoteCommentDocument>,
    @InjectModel(NoteCollaborator.name)
    private noteCollaboratorModel: Model<NoteCollaboratorDocument>,
    private workspacesService: WorkspacesService
  ) {}

  async create(userId: string, createNoteDto: CreateNoteDto): Promise<NoteDocument> {
    // Verify workspace membership
    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      createNoteDto.workspaceId,
      userId
    );
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // If parentId is provided, verify parent exists
    if (createNoteDto.parentId) {
      const parent = await this.noteModel.findById(createNoteDto.parentId).exec();
      if (!parent) {
        throw new NotFoundException('Parent note not found');
      }
      if (parent.workspaceId !== createNoteDto.workspaceId) {
        throw new BadRequestException('Parent note must be in the same workspace');
      }
    }

    const note = new this.noteModel({
      ...createNoteDto,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedNote = await note.save();

    // Create initial version
    await this.createVersion(savedNote._id.toString(), userId, savedNote.title, savedNote.content);

    // Add creator as admin collaborator
    await this.noteCollaboratorModel.create({
      noteId: savedNote._id.toString(),
      userId,
      permission: 'admin',
    });

    return savedNote;
  }

  async findAll(
    workspaceId: string,
    userId: string,
    parentId?: string,
    includeArchived = false
  ): Promise<NoteDocument[]> {
    // Verify workspace membership
    const workspaceMember = await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const query: any = { workspaceId };
    if (parentId === undefined || parentId === null) {
      query.parentId = { $exists: false };
    } else {
      query.parentId = parentId;
    }

    if (!includeArchived) {
      query.isArchived = false;
    }

    const notes = await this.noteModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username email firstName lastName avatar')
      .populate('updatedBy', 'username email firstName lastName avatar')
      .exec();

    // Filter notes user has access to
    const accessibleNotes = [];
    for (const note of notes) {
      const hasAccess = await this.checkNoteAccess(note._id.toString(), userId);
      if (hasAccess) {
        accessibleNotes.push(note);
      }
    }

    return accessibleNotes;
  }

  async findOne(id: string, userId: string): Promise<NoteDocument> {
    const note = await this.noteModel.findById(id).exec();
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    // Check access
    const hasAccess = await this.checkNoteAccess(id, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this note');
    }

    return note;
  }

  async update(id: string, userId: string, updateDto: UpdateNoteDto): Promise<NoteDocument> {
    const note = await this.findOne(id, userId);

    // Check write permission
    const hasWriteAccess = await this.checkNotePermission(id, userId, ['write', 'admin']);
    if (!hasWriteAccess) {
      throw new ForbiddenException('You do not have permission to edit this note');
    }

    // Save current version before update
    if (updateDto.title || updateDto.content) {
      await this.createVersion(
        id,
        userId,
        updateDto.title || note.title,
        updateDto.content || note.content
      );
    }

    // Update note
    if (updateDto.title) note.title = updateDto.title;
    if (updateDto.content) note.content = updateDto.content;
    if (updateDto.isArchived !== undefined) note.isArchived = updateDto.isArchived;
    if (updateDto.parentId !== undefined) {
      // Verify parent exists if provided
      if (updateDto.parentId) {
        const parent = await this.noteModel.findById(updateDto.parentId).exec();
        if (!parent) {
          throw new NotFoundException('Parent note not found');
        }
        if (parent.workspaceId !== note.workspaceId) {
          throw new BadRequestException('Parent note must be in the same workspace');
        }
      }
      note.parentId = updateDto.parentId;
    }

    note.updatedBy = userId;
    return note.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const note = await this.findOne(id, userId);

    // Only admin or note creator can delete
    const hasAdminAccess = await this.checkNotePermission(id, userId, ['admin']);
    const isCreator = note.createdBy.toString() === userId;

    if (!hasAdminAccess && !isCreator) {
      throw new ForbiddenException('You do not have permission to delete this note');
    }

    // Soft delete by archiving
    note.isArchived = true;
    await note.save();
  }

  async getVersions(noteId: string, userId: string): Promise<NoteVersionDocument[]> {
    await this.findOne(noteId, userId);

    return this.noteVersionModel
      .find({ noteId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username email firstName lastName avatar')
      .exec();
  }

  async restoreVersion(noteId: string, versionId: string, userId: string): Promise<NoteDocument> {
    const note = await this.findOne(noteId, userId);
    const hasWriteAccess = await this.checkNotePermission(noteId, userId, ['write', 'admin']);

    if (!hasWriteAccess) {
      throw new ForbiddenException('You do not have permission to restore this version');
    }

    const version = await this.noteVersionModel.findById(versionId).exec();
    if (!version || version.noteId !== noteId) {
      throw new NotFoundException('Version not found');
    }

    // Create new version from current state
    await this.createVersion(noteId, userId, note.title, note.content);

    // Restore version
    note.title = version.title;
    note.content = version.content;
    note.updatedBy = userId;

    return note.save();
  }

  async addComment(
    noteId: string,
    userId: string,
    createCommentDto: CreateCommentDto
  ): Promise<NoteCommentDocument> {
    await this.findOne(noteId, userId);

    // If parentId is provided, verify parent comment exists
    if (createCommentDto.parentId) {
      const parentComment = await this.noteCommentModel
        .findById(createCommentDto.parentId)
        .exec();
      if (!parentComment || parentComment.noteId !== noteId) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = new this.noteCommentModel({
      noteId,
      userId,
      content: createCommentDto.content,
      parentId: createCommentDto.parentId,
    });

    return comment.save();
  }

  async getComments(noteId: string, userId: string): Promise<NoteCommentDocument[]> {
    await this.findOne(noteId, userId);

    return this.noteCommentModel
      .find({ noteId })
      .sort({ createdAt: 1 })
      .populate('userId', 'username email firstName lastName avatar')
      .exec();
  }

  async updateComment(
    noteId: string,
    commentId: string,
    userId: string,
    content: string
  ): Promise<NoteCommentDocument> {
    await this.findOne(noteId, userId);

    const comment = await this.noteCommentModel.findById(commentId).exec();
    if (!comment || comment.noteId !== noteId) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = content;
    return comment.save();
  }

  async deleteComment(noteId: string, commentId: string, userId: string): Promise<void> {
    await this.findOne(noteId, userId);

    const comment = await this.noteCommentModel.findById(commentId).exec();
    if (!comment || comment.noteId !== noteId) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.noteCommentModel.findByIdAndDelete(commentId).exec();
  }

  async addCollaborator(
    noteId: string,
    userId: string,
    targetUserId: string,
    permission: 'read' | 'write' | 'admin'
  ): Promise<NoteCollaboratorDocument> {
    const note = await this.findOne(noteId, userId);

    // Only admin can add collaborators
    const hasAdminAccess = await this.checkNotePermission(noteId, userId, ['admin']);
    if (!hasAdminAccess) {
      throw new ForbiddenException('Only admins can add collaborators');
    }

    // Verify target user is workspace member
    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      note.workspaceId,
      targetUserId
    );
    if (!workspaceMember) {
      throw new BadRequestException('User is not a member of this workspace');
    }

    // Check if collaborator already exists
    const existing = await this.noteCollaboratorModel
      .findOne({ noteId, userId: targetUserId })
      .exec();

    if (existing) {
      existing.permission = permission;
      return existing.save();
    }

    const collaborator = new this.noteCollaboratorModel({
      noteId,
      userId: targetUserId,
      permission,
    });

    return collaborator.save();
  }

  async getCollaborators(noteId: string, userId: string): Promise<NoteCollaboratorDocument[]> {
    await this.findOne(noteId, userId);

    return this.noteCollaboratorModel
      .find({ noteId })
      .populate('userId', 'username email firstName lastName avatar')
      .exec();
  }

  async removeCollaborator(noteId: string, userId: string, targetUserId: string): Promise<void> {
    const note = await this.findOne(noteId, userId);

    // Only admin can remove collaborators
    const hasAdminAccess = await this.checkNotePermission(noteId, userId, ['admin']);
    if (!hasAdminAccess) {
      throw new ForbiddenException('Only admins can remove collaborators');
    }

    // Cannot remove note creator
    if (note.createdBy.toString() === targetUserId) {
      throw new BadRequestException('Cannot remove note creator');
    }

    await this.noteCollaboratorModel.deleteOne({ noteId, userId: targetUserId }).exec();
  }

  private async createVersion(
    noteId: string,
    userId: string,
    title: string,
    content: string
  ): Promise<NoteVersionDocument> {
    const version = new this.noteVersionModel({
      noteId,
      title,
      content,
      createdBy: userId,
    });

    return version.save();
  }

  private async checkNoteAccess(noteId: string, userId: string): Promise<boolean> {
    const note = await this.noteModel.findById(noteId).exec();
    if (!note) return false;

    // Note creator always has access
    if (note.createdBy.toString() === userId) {
      return true;
    }

    // Check workspace membership
    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      note.workspaceId,
      userId
    );
    if (!workspaceMember) {
      return false;
    }

    // Check explicit collaborator permission
    const collaborator = await this.noteCollaboratorModel
      .findOne({ noteId, userId })
      .exec();

    return !!collaborator;
  }

  private async checkNotePermission(
    noteId: string,
    userId: string,
    permissions: string[]
  ): Promise<boolean> {
    const note = await this.noteModel.findById(noteId).exec();
    if (!note) return false;

    // Note creator always has admin access
    if (note.createdBy.toString() === userId) {
      return true;
    }

    const collaborator = await this.noteCollaboratorModel
      .findOne({ noteId, userId })
      .exec();

    if (!collaborator) {
      return false;
    }

    return permissions.includes(collaborator.permission);
  }
}
