import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useCreateNote } from '@/hooks/useNotes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MainLayout } from '@/components/layout/MainLayout';
import { useTeams } from '@/hooks/useTeams';

export function CreateNotePage() {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const location = useLocation();
  const createNote = useCreateNote();
  const { data: teams = [] } = useTeams(workspaceId || '');
  const initialTitle = (location.state as { title?: string } | null)?.title ?? '';
  const [formData, setFormData] = useState({
    title: initialTitle,
    content: '',
    teamIds: [] as string[],
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!workspaceId) {
      setError('Workspace ID is required');
      return;
    }

    try {
      const note = await createNote.mutateAsync({
        workspaceId,
        title: formData.title,
        content: formData.content,
        teamIds: formData.teamIds.length ? formData.teamIds : undefined,
      });
      navigate(`/notes/${note._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create note');
    }
  };

  return (
    <MainLayout>
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Create Note</h2>
            {workspaceId ? (
              <button
                type="button"
                onClick={() => navigate(`/workspaces/${workspaceId}/notes`)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to Notes
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-3xl">
          <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="mt-1 flex min-h-[260px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={10}
                  />
                </div>
                <div>
                  <Label>Visible to Teams (optional)</Label>
                  <div className="mt-2 border border-border rounded-md p-3 max-h-40 overflow-auto space-y-2">
                    {teams.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No teams yet. Note will be visible to all workspace members.</p>
                    ) : (
                      teams.map((team) => (
                        <label key={team._id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.teamIds.includes(team._id)}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                teamIds: e.target.checked
                                  ? [...prev.teamIds, team._id]
                                  : prev.teamIds.filter((id) => id !== team._id),
                              }))
                            }
                          />
                          <span>{team.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(workspaceId ? `/workspaces/${workspaceId}/notes` : '/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createNote.isPending}>
                  {createNote.isPending ? 'Creating...' : 'Create Note'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
