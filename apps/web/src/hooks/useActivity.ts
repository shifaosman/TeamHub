import { useQuery } from '@tanstack/react-query';
import { activityApi, ActivityItem } from '@/lib/activityApi';

export const activityKeys = {
  all: ['activity'] as const,
  list: (params: { workspaceId?: string; projectId?: string; taskId?: string; limit?: number; offset?: number }) =>
    [
      ...activityKeys.all,
      params.workspaceId ?? null,
      params.projectId ?? null,
      params.taskId ?? null,
      params.limit ?? null,
      params.offset ?? null,
    ] as const,
};

export function useActivity(params: {
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
  limit?: number;
  offset?: number;
}) {
  const enabled = !!params.workspaceId || !!params.projectId || !!params.taskId;
  return useQuery<ActivityItem[]>({
    queryKey: activityKeys.list(params),
    queryFn: () => activityApi.list(params),
    enabled,
  });
}

