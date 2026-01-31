import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Message } from './useMessages';
import { Channel } from './useChannels';

export interface SearchResult {
  messages: Message[];
  channels: Channel[];
  users: Array<{
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    role: string;
  }>;
  total: number;
}

export interface SearchMessagesParams {
  workspaceId: string;
  query: string;
  channelId?: string;
  userId?: string;
  hasFile?: boolean;
  hasLink?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export function useSearchMessages(params: SearchMessagesParams) {
  return useQuery<Message[]>({
    queryKey: ['search-messages', params],
    queryFn: async () => {
      const response = await api.post('/search/messages', params);
      return response.data;
    },
    enabled: !!params.query && params.query.length > 0,
  });
}

export function useSearchChannels(workspaceId: string, query: string) {
  return useQuery<Channel[]>({
    queryKey: ['search-channels', workspaceId, query],
    queryFn: async () => {
      const response = await api.get(`/search/channels?workspaceId=${workspaceId}&query=${encodeURIComponent(query)}`);
      return response.data;
    },
    enabled: !!workspaceId && !!query && query.length > 0,
  });
}

export function useSearchUsers(workspaceId: string, query: string) {
  return useQuery<SearchResult['users']>({
    queryKey: ['search-users', workspaceId, query],
    queryFn: async () => {
      const response = await api.get(`/search/users?workspaceId=${workspaceId}&query=${encodeURIComponent(query)}`);
      return response.data;
    },
    enabled: !!workspaceId && !!query && query.length > 0,
  });
}

export function useGlobalSearch(workspaceId: string, query: string, limit = 20) {
  return useQuery<SearchResult>({
    queryKey: ['global-search', workspaceId, query, limit],
    queryFn: async () => {
      const response = await api.get(
        `/search/global?workspaceId=${workspaceId}&query=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response.data;
    },
    enabled: !!workspaceId && !!query && query.length > 0,
  });
}
