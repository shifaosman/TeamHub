import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi, Comment } from '@/lib/projectsApi';

export const commentsKeys = {
  all: ['comments'] as const,
  lists: () => [...commentsKeys.all, 'list'] as const,
  list: (taskId: string) => [...commentsKeys.lists(), taskId] as const,
};

export function useComments(taskId: string) {
  return useQuery<Comment[]>({
    queryKey: commentsKeys.list(taskId),
    queryFn: () => projectsApi.listComments(taskId),
    enabled: !!taskId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { taskId: string; projectId: string; workspaceId: string; body: string }) =>
      projectsApi.createComment(data),
    onSuccess: (comment) => {
      queryClient.invalidateQueries({ queryKey: commentsKeys.list(comment.taskId) });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { commentId: string; taskId: string }) => projectsApi.deleteComment(data.commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: commentsKeys.list(variables.taskId) });
    },
  });
}

