import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Channel, ChannelDocument } from './schemas/channel.schema';
import { ChannelMember, ChannelMemberDocument } from './schemas/channel-member.schema';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { AddChannelMembersDto } from './dto/add-members.dto';
import { ChannelType } from '@teamhub/shared';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { UserRole } from '@teamhub/shared';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel(Channel.name) private channelModel: Model<ChannelDocument>,
    @InjectModel(ChannelMember.name)
    private channelMemberModel: Model<ChannelMemberDocument>,
    private workspacesService: WorkspacesService
  ) {}

  async create(userId: string, createChannelDto: CreateChannelDto): Promise<ChannelDocument> {
    // Verify workspace exists and user is a member
    const workspace = await this.workspacesService.findWorkspaceById(
      createChannelDto.workspaceId
    );
    const member = await this.workspacesService.getWorkspaceMember(
      createChannelDto.workspaceId,
      userId
    );

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Check workspace settings
    if (createChannelDto.type === ChannelType.PUBLIC && !workspace.settings.allowPublicChannels) {
      throw new BadRequestException('Public channels are not allowed in this workspace');
    }

    if (createChannelDto.type === ChannelType.PRIVATE && !workspace.settings.allowPrivateChannels) {
      throw new BadRequestException('Private channels are not allowed in this workspace');
    }

    // Generate slug from name
    const slug = createChannelDto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists in workspace
    const existing = await this.channelModel
      .findOne({
        workspaceId: createChannelDto.workspaceId,
        slug,
      })
      .exec();

    if (existing) {
      throw new BadRequestException('Channel with this name already exists');
    }

    const channel = new this.channelModel({
      ...createChannelDto,
      slug,
      createdBy: userId,
      memberIds: createChannelDto.memberIds || [userId],
    });

    const savedChannel = await channel.save();

    // Add creator as member
    await this.channelMemberModel.create({
      channelId: savedChannel._id.toString(),
      userId,
    });

    // Add other members if specified
    if (createChannelDto.memberIds && createChannelDto.memberIds.length > 0) {
      const membersToAdd = createChannelDto.memberIds
        .filter((id) => id !== userId)
        .map((memberId) => ({
          channelId: savedChannel._id.toString(),
          userId: memberId,
        }));

      if (membersToAdd.length > 0) {
        await this.channelMemberModel.insertMany(membersToAdd);
      }
    }

    return savedChannel;
  }

  async findAll(workspaceId: string, userId: string): Promise<ChannelDocument[]> {
    // Get user's workspace membership
    const member = await this.workspacesService.getWorkspaceMember(workspaceId, userId);
    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Get all channels user has access to
    const userChannelMemberships = await this.channelMemberModel
      .find({ userId })
      .select('channelId')
      .exec();
    const userChannelIds = userChannelMemberships.map((m) => m.channelId);

    // Get public channels and user's private channels
    const channels = await this.channelModel
      .find({
        workspaceId,
        isArchived: false,
        $or: [
          { type: ChannelType.PUBLIC },
          { type: ChannelType.ANNOUNCEMENT },
          { _id: { $in: userChannelIds } },
        ],
      })
      .sort({ createdAt: 1 })
      .exec();

    return channels;
  }

  async findOne(id: string, userId: string): Promise<ChannelDocument> {
    const channel = await this.channelModel.findById(id).exec();
    if (!channel) {
      throw new NotFoundException(`Channel with ID ${id} not found`);
    }

    // Check access
    await this.ensureChannelAccess(channel, userId);

    return channel;
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateChannelDto
  ): Promise<ChannelDocument> {
    const channel = await this.findOne(id, userId);

    // Only channel creator or workspace admin/owner can update
    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      channel.workspaceId,
      userId
    );
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const canEdit =
      channel.createdBy === userId ||
      workspaceMember.role === UserRole.OWNER ||
      workspaceMember.role === UserRole.ADMIN;

    if (!canEdit) {
      throw new ForbiddenException('You do not have permission to edit this channel');
    }

    Object.assign(channel, updateDto);
    return channel.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const channel = await this.findOne(id, userId);

    // Only channel creator or workspace owner can delete
    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      channel.workspaceId,
      userId
    );
    if (!workspaceMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const canDelete =
      channel.createdBy === userId || workspaceMember.role === UserRole.OWNER;

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this channel');
    }

    await this.channelModel.findByIdAndDelete(id).exec();
    await this.channelMemberModel.deleteMany({ channelId: id }).exec();
  }

  async addMembers(id: string, userId: string, addMembersDto: AddChannelMembersDto): Promise<void> {
    const channel = await this.findOne(id, userId);

    // Verify user can add members (must be channel member)
    await this.ensureChannelAccess(channel, userId);

    // Verify all users are workspace members
    for (const memberId of addMembersDto.userIds) {
      const workspaceMember = await this.workspacesService.getWorkspaceMember(
        channel.workspaceId,
        memberId
      );
      if (!workspaceMember) {
        throw new BadRequestException(`User ${memberId} is not a member of this workspace`);
      }

      // Check if already a member
      const existing = await this.channelMemberModel
        .findOne({ channelId: id, userId: memberId })
        .exec();
      if (existing) {
        continue; // Skip if already a member
      }

      await this.channelMemberModel.create({
        channelId: id,
        userId: memberId,
      });

      // Update channel memberIds array
      if (!channel.memberIds.includes(memberId)) {
        channel.memberIds.push(memberId);
      }
    }

    await channel.save();
  }

  async removeMember(channelId: string, targetUserId: string, removerUserId: string): Promise<void> {
    const channel = await this.findOne(channelId, removerUserId);

    // Cannot remove from public channels (they're open to all)
    if (channel.type === ChannelType.PUBLIC || channel.type === ChannelType.ANNOUNCEMENT) {
      throw new BadRequestException('Cannot remove members from public channels');
    }

    // Can remove if: remover is channel creator, workspace admin/owner, or removing themselves
    const workspaceMember = await this.workspacesService.getWorkspaceMember(
      channel.workspaceId,
      removerUserId
    );

    const canRemove =
      channel.createdBy === removerUserId ||
      workspaceMember?.role === UserRole.OWNER ||
      workspaceMember?.role === UserRole.ADMIN ||
      targetUserId === removerUserId;

    if (!canRemove) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    await this.channelMemberModel.deleteOne({ channelId, userId: targetUserId }).exec();

    // Update channel memberIds array
    channel.memberIds = channel.memberIds.filter((id) => id !== targetUserId);
    await channel.save();
  }

  async getChannelMembers(channelId: string): Promise<ChannelMemberDocument[]> {
    return this.channelMemberModel
      .find({ channelId })
      .populate('userId', 'email username firstName lastName avatar')
      .exec();
  }

  async updateLastRead(channelId: string, userId: string): Promise<void> {
    await this.channelMemberModel
      .findOneAndUpdate(
        { channelId, userId },
        { lastReadAt: new Date() },
        { upsert: true, new: true }
      )
      .exec();
  }

  async ensureChannelAccess(channel: ChannelDocument, userId: string): Promise<void> {
    // Public and announcement channels are accessible to all workspace members
    if (channel.type === ChannelType.PUBLIC || channel.type === ChannelType.ANNOUNCEMENT) {
      const workspaceMember = await this.workspacesService.getWorkspaceMember(
        channel.workspaceId,
        userId
      );
      if (!workspaceMember) {
        throw new ForbiddenException('You are not a member of this workspace');
      }
      return;
    }

    // Private channels require explicit membership
    const member = await this.channelMemberModel
      .findOne({ channelId: channel._id.toString(), userId })
      .exec();

    if (!member) {
      throw new ForbiddenException('You do not have access to this channel');
    }
  }
}
