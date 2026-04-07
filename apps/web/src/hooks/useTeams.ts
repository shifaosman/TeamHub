import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Team {
  _id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  _id: string;
  teamId: string;
  workspaceId: string;
  userId:
    | string
    | {
        _id: string;
        username?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
      };
}

export function useTeams(workspaceId: string) {
  return useQuery<Team[]>({
    queryKey: ['teams', workspaceId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/workspaces/${workspaceId}/teams`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { workspaceId: string; name: string; description?: string }) => {
      const response = await api.post('/workspaces/teams', data);
      return response.data as Team;
    },
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ['teams', team.workspaceId] });
    },
  });
}

export function useTeamMembers(teamId: string) {
  return useQuery<TeamMember[]>({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      const response = await api.get(`/workspaces/teams/${teamId}/members`);
      return response.data;
    },
    enabled: !!teamId,
  });
}

export function useAddTeamMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { teamId: string; userIds: string[] }) => {
      const response = await api.post(`/workspaces/teams/${data.teamId}/members`, {
        userIds: data.userIds,
      });
      return { response: response.data, teamId: data.teamId };
    },
    onSuccess: ({ teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
  });
}
