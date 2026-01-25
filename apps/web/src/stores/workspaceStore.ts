import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  _id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  settings: WorkspaceSettings;
  createdAt: string;
  updatedAt: string;
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
  role: string;
  joinedAt: string;
  lastActiveAt?: string;
}

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  organizations: Organization[];
  isLoading: boolean;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  fetchWorkspaces: () => Promise<void>;
  fetchOrganizations: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspace: null,
  workspaces: [],
  organizations: [],
  isLoading: false,
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/workspaces/workspaces');
      set({ workspaces: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
      set({ isLoading: false });
    }
  },
  fetchOrganizations: async () => {
    try {
      const response = await api.get('/workspaces/organizations');
      set({ organizations: response.data });
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  },
}));
