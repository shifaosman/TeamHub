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
  sourceChannelId?: string;
  sourceWorkspaceId?: string;
  dueAt?: string;
  createdBy: string;
  order?: number;

  createdAt: string;
  updatedAt: string;
}
