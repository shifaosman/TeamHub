import { z } from 'zod';
import { UserRole } from '../types/auth';

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
});

export const createWorkspaceSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  settings: z
    .object({
      allowPublicChannels: z.boolean().optional(),
      allowPrivateChannels: z.boolean().optional(),
      allowDMs: z.boolean().optional(),
      requireInvite: z.boolean().optional(),
    })
    .optional(),
});

export const inviteToWorkspaceSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole).default(UserRole.MEMBER),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteToWorkspaceInput = z.infer<typeof inviteToWorkspaceSchema>;
