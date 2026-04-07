import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useWorkspaceMembers } from '@/hooks/useWorkspaces';
import { useAddTeamMembers, useCreateTeam, useTeamMembers, useTeams } from '@/hooks/useTeams';

export function TeamsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const workspaceId = currentWorkspace?._id || '';
  const { data: teams = [], isLoading: teamsLoading } = useTeams(workspaceId);
  const { data: workspaceMembers = [] } = useWorkspaceMembers(workspaceId);
  const createTeam = useCreateTeam();
  const addTeamMembers = useAddTeamMembers();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const { data: selectedTeamMembers = [] } = useTeamMembers(selectedTeamId);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const memberIdsInTeam = useMemo(() => {
    return new Set(
      selectedTeamMembers.map((m) => (typeof m.userId === 'string' ? m.userId : m.userId._id))
    );
  }, [selectedTeamMembers]);

  const selectableMembers = useMemo(() => {
    return (workspaceMembers as any[]).filter((m) => !memberIdsInTeam.has(m.userId?._id || m.userId));
  }, [workspaceMembers, memberIdsInTeam]);

  async function onCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!workspaceId) return;
    try {
      const team = await createTeam.mutateAsync({
        workspaceId,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName('');
      setDescription('');
      setSelectedTeamId(team._id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create team');
    }
  }

  async function onAddMembers() {
    setError('');
    if (!selectedTeamId || selectedUserIds.length === 0) return;
    try {
      await addTeamMembers.mutateAsync({ teamId: selectedTeamId, userIds: selectedUserIds });
      setSelectedUserIds([]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add members');
    }
  }

  return (
    <MainLayout>
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-10">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Teams {currentWorkspace ? <span className="text-muted-foreground">· {currentWorkspace.name}</span> : null}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create teams and control who can see team-scoped channels, projects, and notes.
          </p>
        </div>
      </header>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Create Team</h3>
          {error ? (
            <div className="mb-3 bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded">
              {error}
            </div>
          ) : null}
          <form onSubmit={onCreateTeam} className="space-y-3">
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Team name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[90px]"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button type="submit" disabled={!workspaceId || !name.trim() || createTeam.isPending}>
              {createTeam.isPending ? 'Creating...' : 'Create Team'}
            </Button>
          </form>
        </section>

        <section className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Manage Team Members</h3>
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-3"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
          >
            <option value="">Select team</option>
            {teams.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>

          {selectedTeamId ? (
            <>
              <div className="mb-3">
                <p className="text-sm font-medium mb-2">Current members</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {selectedTeamMembers.length === 0
                    ? 'No members yet.'
                    : selectedTeamMembers.map((m) => {
                        const user = typeof m.userId === 'string' ? { _id: m.userId } : m.userId;
                        return <div key={m._id}>{user.username || user.email || user._id}</div>;
                      })}
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-sm font-medium mb-2">Add workspace members</p>
                <div className="max-h-48 overflow-auto border border-border rounded-md p-2 space-y-2">
                  {selectableMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No available members to add.</p>
                  ) : (
                    selectableMembers.map((m: any) => {
                      const id = m.userId?._id || m.userId;
                      const label = m.userId?.username || m.userId?.email || id;
                      return (
                        <label key={id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(id)}
                            onChange={(e) =>
                              setSelectedUserIds((prev) =>
                                e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)
                              )
                            }
                          />
                          <span>{label}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                <div className="mt-3">
                  <Button
                    onClick={onAddMembers}
                    disabled={selectedUserIds.length === 0 || addTeamMembers.isPending}
                  >
                    {addTeamMembers.isPending ? 'Adding...' : 'Add Selected Members'}
                  </Button>
                </div>
              </div>
            </>
          ) : teamsLoading ? (
            <p className="text-sm text-muted-foreground">Loading teams...</p>
          ) : (
            <p className="text-sm text-muted-foreground">Select a team to manage members.</p>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
