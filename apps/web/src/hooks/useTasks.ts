import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi, Task, TaskStatus } from '@/lib/projectsApi';

export const tasksKeys = {
  all: ['tasks'] as const,
  lists: () => [...tasksKeys.all, 'list'] as const,
  list: (projectId: string, filters?: { status?: TaskStatus; assigneeId?: string }) =>
    [
      ...tasksKeys.lists(),
      projectId,
      filters?.status ?? null,
      filters?.assigneeId ?? null,
    ] as const,
};

export function useTasks(projectId: string, filters?: { status?: TaskStatus; assigneeId?: string }) {
  return useQuery<Task[]>({
    queryKey: tasksKeys.list(projectId, filters),
    queryFn: () => projectsApi.listTasks(projectId, filters),
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      projectId: string;
      workspaceId: string;
      title: string;
      description?: string;
      status?: TaskStatus;
      assigneeId?: string | null;
    }) => projectsApi.createTask(data),
    onSuccess: (task) => {
      // Refresh all task queries for this project
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      // Also refresh project details (counts, etc. if used)
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', task.projectId] });
    },
  });
}

export function useCreateTaskFromMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      messageId: string;
      projectId: string;
      title?: string;
      status?: TaskStatus;
      assigneeId?: string | null;
    }) => projectsApi.createTaskFromMessage(data),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', task.projectId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      taskId: string;
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      assigneeId?: string | null;
    }) => {
      const { taskId, ...payload } = data;
      // IMPORTANT: do not send taskId in body (backend ValidationPipe forbids unknown props)
      return projectsApi.updateTask(taskId, payload);
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', task.projectId] });
    },
  });
}

export function useUpdateTaskAssignee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { taskId: string; assigneeId?: string | null }) =>
      projectsApi.updateTaskAssignee(data.taskId, { assigneeId: data.assigneeId ?? null }),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', task.projectId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUpdateTaskWatchers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { taskId: string; watcherIds: string[] }) =>
      projectsApi.updateTaskWatchers(data.taskId, { watcherIds: data.watcherIds }),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', task.projectId] });
    },
  });
}

export function useUpdateTaskDue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { taskId: string; dueAt?: string | null }) =>
      projectsApi.updateTaskDue(data.taskId, { dueAt: data.dueAt ?? null }),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['projects', 'detail', task.projectId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => projectsApi.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useReorderTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      projectId: string;
      workspaceId: string;
      status: TaskStatus;
      orderedTaskIds: string[];
    }) => projectsApi.reorderTasks(data),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists() });

      // Snapshot all caches for this project (all filters)
      const matching = queryClient.getQueriesData<Task[]>({
        queryKey: tasksKeys.lists(),
      });

      // Optimistically update each cached list that includes this project's tasks
      for (const [key, value] of matching) {
        if (!Array.isArray(value)) continue;

        // Only update caches that are for this project
        // key shape: ['tasks','list',projectId, status|null, assigneeId|null]
        const projectIdInKey = (key as any[])[2];
        if (projectIdInKey !== variables.projectId) continue;

        const next = value.map((t) => ({ ...t }));
        const inStatus = next.filter((t) => t.status === variables.status);
        const byId = new Map(inStatus.map((t) => [t._id, t] as const));

        // If this cache doesn't contain all ids, don't reorder it (avoid weird partial views)
        const hasAll = variables.orderedTaskIds.every((id) => byId.has(id));
        if (!hasAll) continue;

        // Apply order updates
        variables.orderedTaskIds.forEach((id, index) => {
          const task = next.find((t) => t._id === id);
          if (task) task.order = index;
        });

        // Re-sort for display consistency
        next.sort((a, b) => {
          if (a.status !== b.status) return a.status.localeCompare(b.status);
          return (a.order ?? 0) - (b.order ?? 0);
        });

        queryClient.setQueryData(key, next);
      }

      return { previous: matching };
    },
    onError: (_err, _vars, ctx) => {
      // Rollback
      if (ctx?.previous) {
        for (const [key, value] of ctx.previous) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.list(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
    },
  });
}

export function useReorderTasksBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      projectId: string;
      workspaceId: string;
      items: { taskId: string; order: number; status?: TaskStatus }[];
    }) => projectsApi.reorderTasksBulk(data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists() });

      const matching = queryClient.getQueriesData<Task[]>({
        queryKey: tasksKeys.lists(),
      });

      const updates = new Map(
        variables.items.map((i) => [i.taskId, { order: i.order, status: i.status }] as const)
      );

      for (const [key, value] of matching) {
        if (!Array.isArray(value)) continue;
        const projectIdInKey = (key as any[])[2];
        if (projectIdInKey !== variables.projectId) continue;

        const statusFilter = (key as any[])[3] as TaskStatus | null;
        const assigneeFilter = (key as any[])[4] as string | null;

        const next = value.map((t) => {
          const u = updates.get(t._id);
          if (!u) return { ...t };
          return {
            ...t,
            order: u.order,
            status: (u.status ?? t.status) as TaskStatus,
          };
        });

        // Enforce filter constraints for this cache
        const filtered = next.filter((t) => {
          if (statusFilter && t.status !== statusFilter) return false;
          if (assigneeFilter && t.assigneeId !== assigneeFilter) return false;
          return true;
        });

        filtered.sort((a, b) => {
          if (a.status !== b.status) return a.status.localeCompare(b.status);
          return (a.order ?? 0) - (b.order ?? 0);
        });

        queryClient.setQueryData(key, filtered);
      }

      return { previous: matching };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        for (const [key, value] of ctx.previous) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.list(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
    },
  });
}

