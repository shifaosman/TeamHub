import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface FileUploader {
  _id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface FileUpload {
  _id: string;
  workspaceId: string;
  channelId?: string;
  folderId?: string;
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
  updatedAt?: string;
  /** Populated by list/details API */
  uploader?: FileUploader | null;
  /** @deprecated use uploader */
  user?: FileUploader;
}

export interface UseFilesOptions {
  channelId?: string;
  folderId?: string;
  search?: string;
  mimeType?: string;
  sort?: 'createdAt' | 'updatedAt' | 'originalName' | 'size';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export function useFiles(workspaceId: string, options: UseFilesOptions = {}) {
  const {
    channelId,
    folderId,
    search,
    mimeType,
    sort = 'createdAt',
    order = 'desc',
    limit = 50,
    offset = 0,
  } = options;

  return useQuery<{ files: FileUpload[]; total: number }>({
    queryKey: ['files', workspaceId, channelId, folderId, search, mimeType, sort, order, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('workspaceId', workspaceId);
      if (channelId) params.append('channelId', channelId);
      if (folderId !== undefined) params.append('folderId', folderId);
      if (search?.trim()) params.append('search', search.trim());
      if (mimeType) params.append('mimeType', mimeType);
      if (sort) params.append('sort', sort);
      if (order) params.append('order', order);
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
      folderId,
      isPublic,
    }: {
      file: File;
      workspaceId: string;
      channelId?: string;
      folderId?: string;
      isPublic?: boolean;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);
      if (channelId) formData.append('channelId', channelId);
      if (folderId !== undefined) formData.append('folderId', folderId);
      if (isPublic !== undefined) formData.append('isPublic', isPublic.toString());

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['files', variables.workspaceId] });
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

export interface FileDetails extends FileUpload {
  previewUrl?: string;
}

export function useFileDetails(fileId: string | null) {
  return useQuery<FileDetails>({
    queryKey: ['file-details', fileId],
    queryFn: async () => {
      const response = await api.get(`/files/${fileId}/details`);
      return response.data;
    },
    enabled: !!fileId,
  });
}

export interface FileCommentItem {
  _id: string;
  fileId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: FileUploader | null;
}

export function useFileComments(fileId: string | null) {
  return useQuery<FileCommentItem[]>({
    queryKey: ['file-comments', fileId],
    queryFn: async () => {
      const response = await api.get(`/files/${fileId}/comments`);
      return response.data;
    },
    enabled: !!fileId,
  });
}

export function useAddFileComment(fileId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/files/${fileId}/comments`, { content });
      return response.data;
    },
    onSuccess: () => {
      if (fileId) {
        queryClient.invalidateQueries({ queryKey: ['file-comments', fileId] });
        queryClient.invalidateQueries({ queryKey: ['file-details', fileId] });
      }
    },
  });
}
