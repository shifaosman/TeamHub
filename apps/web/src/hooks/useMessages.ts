import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Message {
  _id: string;
  channelId: string;
  workspaceId: string;
  userId: string;
  content: string;
  threadId?: string;
  replyToId?: string;
  editedAt?: string;
  deletedAt?: string;
  isPinned: boolean;
  reactions: Array<{ emoji: string; userIds: string[] }>;
  attachments: string[];
  mentions: string[];
  isTaskCandidate?: boolean;
  convertedToTask?: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export function useMessages(channelId: string, limit = 50, before?: string) {
  return useQuery<Message[]>({
    queryKey: ['messages', channelId, before],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (before) params.append('before', before);
      const response = await api.get(`/messages/channel/${channelId}?${params.toString()}`);
      return response.data;
    },
    enabled: !!channelId,
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      channelId: string;
      content?: string;
      threadId?: string;
      replyToId?: string;
      attachments?: string[];
    }) => {
      const response = await api.post('/messages', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.channelId] });
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const response = await api.patch(`/messages/${messageId}`, { content });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.channelId] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      const response = await api.delete(`/messages/${messageId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useThreadMessages(threadId: string | null) {
  return useQuery<Message[]>({
    queryKey: ['messages', 'thread', threadId],
    queryFn: async () => {
      if (!threadId) return [];
      const response = await api.get(`/messages/thread/${threadId}`);
      return response.data;
    },
    enabled: !!threadId,
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.channelId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'thread'] });
    },
  });
}

export function useConvertMessageToTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      messageId: string;
      projectId: string;
      title?: string;
      assigneeId?: string | null;
    }) => {
      const response = await api.post(`/messages/${data.messageId}/convert-to-task`, {
        projectId: data.projectId,
        title: data.title,
        assigneeId: data.assigneeId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
