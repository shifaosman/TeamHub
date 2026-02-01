import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateWorkspace, useOrganizations } from '@/hooks/useWorkspaces';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MainLayout } from '@/components/layout/MainLayout';

export function CreateWorkspacePage() {
  const navigate = useNavigate();
  const { data: organizations } = useOrganizations();
  const createWorkspace = useCreateWorkspace();
  const [formData, setFormData] = useState({
    organizationId: '',
    name: '',
    slug: '',
    description: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.organizationId) {
      setError('Please select an organization');
      return;
    }

    try {
      await createWorkspace.mutateAsync({
        organizationId: formData.organizationId,
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create workspace');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <MainLayout>
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-10">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-semibold text-foreground">Create Workspace</h2>
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
                  <Label htmlFor="organizationId">Organization</Label>
                  <select
                    id="organizationId"
                    data-testid="workspace-organization"
                    required
                    value={formData.organizationId}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Select an organization</option>
                    {organizations?.map((org) => (
                      <option key={org._id} value={org._id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="name">Workspace Name</Label>
                  <Input
                    id="name"
                    data-testid="workspace-name"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({
                        ...formData,
                        name,
                        slug: generateSlug(name),
                      });
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    data-testid="workspace-slug"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="mt-1"
                    pattern="^[a-z0-9-]+$"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lowercase letters, numbers, and hyphens only
                  </p>
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
                <Button type="submit" disabled={createWorkspace.isPending}>
                  {createWorkspace.isPending ? 'Creating...' : 'Create Workspace'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
