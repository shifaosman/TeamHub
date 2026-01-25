import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Note {
  _id: string;
  workspaceId: string;
  parentId?: string;
  title: string;
  content: string;
  createdBy: string;
  updatedBy: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUser?: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  updatedByUser?: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface NoteVersion {
  _id: string;
  noteId: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  createdByUser?: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface NoteComment {
  _id: string;
  noteId: string;
  userId: string;
  content: string;
  parentId?: string;
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

export function useNotes(workspaceId: string, parentId?: string, includeArchived = false) {
  return useQuery<Note[]>({
    queryKey: ['notes', workspaceId, parentId, includeArchived],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('workspaceId', workspaceId);
      if (parentId) params.append('parentId', parentId);
      if (includeArchived) params.append('includeArchived', 'true');
      const response = await api.get(`/notes?${params.toString()}`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
}

export function useNote(noteId: string) {
  return useQuery<Note>({
    queryKey: ['note', noteId],
    queryFn: async () => {
      const response = await api.get(`/notes/${noteId}`);
      return response.data;
    },
    enabled: !!noteId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      workspaceId: string;
      parentId?: string;
      title: string;
      content: string;
    }) => {
      const response = await api.post('/notes', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.workspaceId] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      noteId,
      ...data
    }: {
      noteId: string;
      title?: string;
      content?: string;
      isArchived?: boolean;
      parentId?: string;
    }) => {
      const response = await api.patch(`/notes/${noteId}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['note', data._id] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (noteId: string) => {
      const response = await api.delete(`/notes/${noteId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useNoteVersions(noteId: string) {
  return useQuery<NoteVersion[]>({
    queryKey: ['note-versions', noteId],
    queryFn: async () => {
      const response = await api.get(`/notes/${noteId}/versions`);
      return response.data;
    },
    enabled: !!noteId,
  });
}

export function useRestoreVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ noteId, versionId }: { noteId: string; versionId: string }) => {
      const response = await api.post(`/notes/${noteId}/versions/${versionId}/restore`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['note', data._id] });
      queryClient.invalidateQueries({ queryKey: ['note-versions', data._id] });
    },
  });
}

export function useNoteComments(noteId: string) {
  return useQuery<NoteComment[]>({
    queryKey: ['note-comments', noteId],
    queryFn: async () => {
      const response = await api.get(`/notes/${noteId}/comments`);
      return response.data;
    },
    enabled: !!noteId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      noteId,
      content,
      parentId,
    }: {
      noteId: string;
      content: string;
      parentId?: string;
    }) => {
      const response = await api.post(`/notes/${noteId}/comments`, { content, parentId });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['note-comments', variables.noteId] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      noteId,
      commentId,
      content,
    }: {
      noteId: string;
      commentId: string;
      content: string;
    }) => {
      const response = await api.patch(`/notes/${noteId}/comments/${commentId}`, { content });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['note-comments', variables.noteId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ noteId, commentId }: { noteId: string; commentId: string }) => {
      const response = await api.delete(`/notes/${noteId}/comments/${commentId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['note-comments', variables.noteId] });
    },
  });
}
