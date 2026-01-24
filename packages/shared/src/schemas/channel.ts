import { z } from 'zod';
import { ChannelType } from '../types/channel';

export const createChannelSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(80),
  type: z.nativeEnum(ChannelType),
  description: z.string().max(250).optional(),
  memberIds: z.array(z.string()).optional(),
});

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(250).optional(),
  isArchived: z.boolean().optional(),
});

export const addChannelMembersSchema = z.object({
  userIds: z.array(z.string()).min(1),
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
export type AddChannelMembersInput = z.infer<typeof addChannelMembersSchema>;
