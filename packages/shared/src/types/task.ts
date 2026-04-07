import { z } from 'zod';
export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  _id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeId?: string | null;
  watcherIds?: string[];
  sourceMessageId?: string;
  createdFromMessageId?: string;
  sourceChannelId?: string;
  sourceWorkspaceId?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalRequired?: boolean;
  dueAt?: string;
  createdBy: string;
  order?: number;

  createdAt: string;
  updatedAt: string;
}
