import { api } from '@/lib/api';

export type ProjectMemberRole = 'admin' | 'member';

export interface ProjectMember {
  userId: string;
  role: ProjectMemberRole;
}

export interface Project {
  _id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdBy: string;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  _id: string;
  projectId: string;
  workspaceId: string;
  sourceMessageId?: string;
  sourceChannelId?: string;
  sourceWorkspaceId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeId?: string | null;
  watcherIds?: string[];
  dueAt?: string;
  createdBy: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  taskId: string;
  projectId: string;
  workspaceId: string;
  body: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const projectsApi = {
  // Projects
  async listProjects(workspaceId: string): Promise<Project[]> {
    const response = await api.get(`/projects?workspaceId=${workspaceId}`);
    return response.data;
  },

  async createProject(data: {
    workspaceId: string;
    name: string;
    description?: string;
  }): Promise<Project> {
    const response = await api.post('/projects', data);
    return response.data;
  },

  async getProject(projectId: string): Promise<Project> {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  async updateProject(projectId: string, data: { name?: string; description?: string }): Promise<Project> {
    const response = await api.patch(`/projects/${projectId}`, data);
    return response.data;
  },

  async addProjectMember(projectId: string, data: { userId: string; role?: ProjectMemberRole }): Promise<Project> {
    const response = await api.post(`/projects/${projectId}/members`, data);
    return response.data;
  },

  async updateProjectMemberRole(
    projectId: string,
    userId: string,
    data: { role: ProjectMemberRole }
  ): Promise<Project> {
    const response = await api.patch(`/projects/${projectId}/members/${userId}`, data);
    return response.data;
  },

  // Tasks
  async listTasks(projectId: string, filters?: { status?: TaskStatus; assigneeId?: string }): Promise<Task[]> {
    const params = new URLSearchParams();
    params.append('projectId', projectId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);
    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data;
  },

  async createTask(data: {
    projectId: string;
    workspaceId: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    assigneeId?: string | null;
  }): Promise<Task> {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  async createTaskFromMessage(data: {
    messageId: string;
    projectId: string;
    title?: string;
    status?: TaskStatus;
    assigneeId?: string | null;
  }): Promise<Task> {
    const response = await api.post('/tasks/from-message', data);
    return response.data;
  },

  async updateTask(
    taskId: string,
    data: { title?: string; description?: string | null; status?: TaskStatus; assigneeId?: string | null }
  ): Promise<Task> {
    const response = await api.patch(`/tasks/${taskId}`, data);
    return response.data;
  },

  async updateTaskAssignee(taskId: string, data: { assigneeId?: string | null }): Promise<Task> {
    const response = await api.patch(`/tasks/${taskId}/assignee`, data);
    return response.data;
  },

  async updateTaskWatchers(taskId: string, data: { watcherIds: string[] }): Promise<Task> {
    const response = await api.patch(`/tasks/${taskId}/watchers`, data);
    return response.data;
  },

  async updateTaskDue(taskId: string, data: { dueAt?: string | null }): Promise<Task> {
    const response = await api.patch(`/tasks/${taskId}/due`, data);
    return response.data;
  },

  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`);
  },

  /**
   * UI-facing reorder payload (easy for DnD):
   * - orderedTaskIds: the desired order for a single column/status
   *
   * Backend payload differs; we map it here to the backend DTO.
   */
  async reorderTasks(data: {
    projectId: string;
    workspaceId: string;
    status: TaskStatus;
    orderedTaskIds: string[];
  }): Promise<{ updated: number }> {
    const items = data.orderedTaskIds.map((taskId, index) => ({
      taskId,
      order: index,
      status: data.status,
    }));
    const response = await api.post('/tasks/reorder', {
      projectId: data.projectId,
      workspaceId: data.workspaceId,
      items,
    });
    return response.data;
  },

  /**
   * Bulk reorder + (optional) status changes.
   * Used for cross-column drag/drop (reorder both source and destination columns).
   */
  async reorderTasksBulk(data: {
    projectId: string;
    workspaceId: string;
    items: { taskId: string; order: number; status?: TaskStatus }[];
  }): Promise<{ updated: number }> {
    const response = await api.post('/tasks/reorder', {
      projectId: data.projectId,
      workspaceId: data.workspaceId,
      items: data.items,
    });
    return response.data;
  },

  // Comments
  async listComments(taskId: string): Promise<Comment[]> {
    const response = await api.get(`/comments?taskId=${taskId}`);
    return response.data;
  },

  async createComment(data: { taskId: string; projectId: string; workspaceId: string; body: string }): Promise<Comment> {
    const response = await api.post('/comments', data);
    return response.data;
  },

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}`);
  },
};

