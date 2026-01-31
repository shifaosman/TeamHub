import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi, Project, ProjectMemberRole } from '@/lib/projectsApi';

export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  list: (workspaceId: string) => [...projectsKeys.lists(), workspaceId] as const,
  details: () => [...projectsKeys.all, 'detail'] as const,
  detail: (projectId: string) => [...projectsKeys.details(), projectId] as const,
};

export function useProjects(workspaceId: string) {
  return useQuery<Project[]>({
    queryKey: projectsKeys.list(workspaceId),
    queryFn: () => projectsApi.listProjects(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useProject(projectId: string) {
  return useQuery<Project>({
    queryKey: projectsKeys.detail(projectId),
    queryFn: () => projectsApi.getProject(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { workspaceId: string; name: string; description?: string }) =>
      projectsApi.createProject(data),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.list(project.workspaceId) });
      queryClient.setQueryData(projectsKeys.detail(project._id), project);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { projectId: string; name?: string; description?: string }) => {
      return projectsApi.updateProject(data.projectId, { name: data.name, description: data.description });
    },
    onSuccess: (project) => {
      queryClient.setQueryData(projectsKeys.detail(project._id), project);
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
    },
  });
}

export function useAddProjectMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { projectId: string; userId: string; role?: ProjectMemberRole }) =>
      projectsApi.addProjectMember(data.projectId, { userId: data.userId, role: data.role }),
    onSuccess: (project) => {
      queryClient.setQueryData(projectsKeys.detail(project._id), project);
      queryClient.invalidateQueries({ queryKey: projectsKeys.list(project.workspaceId) });
    },
  });
}

export function useUpdateProjectMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { projectId: string; userId: string; role: ProjectMemberRole }) =>
      projectsApi.updateProjectMemberRole(data.projectId, data.userId, { role: data.role }),
    onSuccess: (project) => {
      queryClient.setQueryData(projectsKeys.detail(project._id), project);
      queryClient.invalidateQueries({ queryKey: projectsKeys.list(project.workspaceId) });
    },
  });
}

