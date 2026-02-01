import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Workspace, Organization } from '@/stores/workspaceStore';

export function useWorkspaces() {
  return useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await api.get('/workspaces/workspaces');
      return response.data;
    },
  });
}

export function useOrganizations() {
  return useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await api.get('/workspaces/organizations');
      return response.data;
    },
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const response = await api.post('/workspaces/organizations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      organizationId: string;
      name: string;
      slug: string;
      description?: string;
    }) => {
      const response = await api.post('/workspaces/workspaces', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/workspaces/${workspaceId}/members`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspaceInviteLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      workspaceId: string;
      role?: string;
      expiresInDays?: number;
      maxUses?: number;
    }) => {
      const response = await api.post(`/workspaces/workspaces/${data.workspaceId}/invite-links`, {
        role: data.role,
        expiresInDays: data.expiresInDays,
        maxUses: data.maxUses,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useAcceptWorkspaceInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tokenOrCode: string) => {
      const response = await api.post(`/workspaces/invites/${encodeURIComponent(tokenOrCode)}/accept`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
