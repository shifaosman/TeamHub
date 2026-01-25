import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Channel {
  _id: string;
  workspaceId: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  isArchived: boolean;
  createdBy: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export function useChannels(workspaceId: string) {
  return useQuery<Channel[]>({
    queryKey: ['channels', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/channels/workspace/${workspaceId}`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      workspaceId: string;
      name: string;
      type: string;
      description?: string;
      memberIds?: string[];
    }) => {
      const response = await api.post('/channels', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels', variables.workspaceId] });
    },
  });
}
