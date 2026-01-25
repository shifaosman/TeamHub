import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Notification {
  _id: string;
  userId: string;
  workspaceId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationPreference {
  _id: string;
  userId: string;
  workspaceId?: string;
  channelId?: string;
  preference: 'all' | 'mentions' | 'none';
  emailEnabled: boolean;
}

export function useNotifications(workspaceId?: string, limit = 50, offset = 0) {
  return useQuery<{ notifications: Notification[]; total: number }>({
    queryKey: ['notifications', workspaceId, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      const response = await api.get(`/notifications?${params.toString()}`);
      return response.data;
    },
  });
}

export function useUnreadCount(workspaceId?: string) {
  return useQuery<number>({
    queryKey: ['notifications', 'unread', workspaceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      const response = await api.get(`/notifications/unread/count?${params.toString()}`);
      return response.data.count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workspaceId?: string) => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      const response = await api.post(`/notifications/read-all?${params.toString()}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useNotificationPreferences(workspaceId?: string, channelId?: string) {
  return useQuery<NotificationPreference>({
    queryKey: ['notification-preferences', workspaceId, channelId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      if (channelId) params.append('channelId', channelId);
      const response = await api.get(`/notifications/preferences?${params.toString()}`);
      return response.data;
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workspaceId,
      channelId,
      preference,
      emailEnabled,
    }: {
      workspaceId?: string;
      channelId?: string;
      preference?: 'all' | 'mentions' | 'none';
      emailEnabled?: boolean;
    }) => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      if (channelId) params.append('channelId', channelId);
      const response = await api.patch(`/notifications/preferences?${params.toString()}`, {
        preference,
        emailEnabled,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['notification-preferences', variables.workspaceId, variables.channelId],
      });
    },
  });
}
