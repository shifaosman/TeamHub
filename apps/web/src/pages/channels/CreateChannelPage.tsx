import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateChannel } from '@/hooks/useChannels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MainLayout } from '@/components/layout/MainLayout';

export function CreateChannelPage() {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const createChannel = useCreateChannel();
  const [formData, setFormData] = useState({
    name: '',
    type: 'public',
    description: '',
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
      await createChannel.mutateAsync({
        workspaceId,
        name: formData.name,
        type: formData.type as any,
        description: formData.description || undefined,
      });
      navigate(`/dashboard`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create channel');
    }
  };

  return (
    <MainLayout>
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-10">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-semibold text-foreground">Create Channel</h2>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-xl">
          <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Channel Name</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Channel Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createChannel.isPending}>
                  {createChannel.isPending ? 'Creating...' : 'Create Channel'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
