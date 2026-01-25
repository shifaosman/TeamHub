import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface FileUpload {
  _id: string;
  workspaceId: string;
  channelId?: string;
  uploadedBy: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  storageUrl: string;
  isPublic: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export function useFiles(workspaceId: string, channelId?: string, limit = 50, offset = 0) {
  return useQuery<{ files: FileUpload[]; total: number }>({
    queryKey: ['files', workspaceId, channelId, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('workspaceId', workspaceId);
      if (channelId) params.append('channelId', channelId);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      const response = await api.get(`/files?${params.toString()}`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      workspaceId,
      channelId,
      isPublic,
    }: {
      file: File;
      workspaceId: string;
      channelId?: string;
      isPublic?: boolean;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);
      if (channelId) formData.append('channelId', channelId);
      if (isPublic !== undefined) formData.append('isPublic', isPublic.toString());

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['files', variables.workspaceId, variables.channelId] });
    },
  });
}

export function useFilePreview(fileId: string) {
  return useQuery<{ url: string; mimeType: string; isImage: boolean; isVideo: boolean; isAudio: boolean; isDocument: boolean }>({
    queryKey: ['file-preview', fileId],
    queryFn: async () => {
      const response = await api.get(`/files/${fileId}/preview`);
      return response.data;
    },
    enabled: !!fileId,
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fileId: string) => {
      const response = await api.delete(`/files/${fileId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}
