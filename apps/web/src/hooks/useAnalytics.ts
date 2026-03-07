import { useQuery } from '@tanstack/react-query';
import { analyticsApi, WorkspaceAnalytics, AnalyticsPeriod } from '@/lib/analyticsApi';

export const analyticsKeys = {
  all: ['analytics'] as const,
  workspace: (workspaceId: string, period: AnalyticsPeriod) =>
    [...analyticsKeys.all, workspaceId, period] as const,
};

export function useWorkspaceAnalytics(workspaceId: string, period: AnalyticsPeriod = '30d') {
  return useQuery<WorkspaceAnalytics>({
    queryKey: analyticsKeys.workspace(workspaceId, period),
    queryFn: () => analyticsApi.getWorkspaceAnalytics(workspaceId, period),
    enabled: !!workspaceId,
  });
}
