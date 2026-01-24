import { UserRole } from './auth';

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  _id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceSettings {
  allowPublicChannels: boolean;
  allowPrivateChannels: boolean;
  allowDMs: boolean;
  requireInvite: boolean;
  defaultChannelId?: string;
}

export interface WorkspaceMember {
  _id: string;
  workspaceId: string;
  userId: string;
  role: UserRole;
  joinedAt: Date;
  lastActiveAt?: Date;
}

export interface WorkspaceInvite {
  _id: string;
  workspaceId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface AuditLog {
  _id: string;
  workspaceId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}
