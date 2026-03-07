import { api } from '@/lib/api';

export type AnalyticsPeriod = '7d' | '30d' | '90d';

export interface OverviewStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  activeChannels: number;
  totalNotes: number;
  totalFiles: number;
  totalMembers: number;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
  label?: string;
}

export interface TaskAnalytics {
  createdOverTime: TimeSeriesPoint[];
  completedOverTime: TimeSeriesPoint[];
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  overdueCount: number;
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
}

export interface ProjectAnalytics {
  projects: ProjectProgress[];
  totalProjects: number;
}

export interface ChannelActivity {
  channelId: string;
  channelName: string;
  messageCount: number;
}

export interface UserActivity {
  userId: string;
  username?: string;
  activityCount: number;
}

export interface CollaborationAnalytics {
  mostActiveChannels: ChannelActivity[];
  mostActiveUsers: UserActivity[];
  messagesOverTime: TimeSeriesPoint[];
  notesEditedOverTime: TimeSeriesPoint[];
  filesUploadedOverTime: TimeSeriesPoint[];
}

export interface WorkspaceAnalytics {
  overview: OverviewStats;
  taskAnalytics: TaskAnalytics;
  projectAnalytics: ProjectAnalytics;
  collaborationAnalytics: CollaborationAnalytics;
  period: AnalyticsPeriod;
}

export const analyticsApi = {
  getWorkspaceAnalytics(workspaceId: string, period: AnalyticsPeriod = '30d'): Promise<WorkspaceAnalytics> {
    return api
      .get<WorkspaceAnalytics>(`/workspaces/${encodeURIComponent(workspaceId)}/analytics`, {
        params: { period },
      })
      .then((res) => res.data);
  },
};
