import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useCreateProject } from '@/hooks/useProjects';

interface ProjectCreateDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectCreateDialog({ workspaceId, open, onOpenChange }: ProjectCreateDialogProps) {
  const { toast } = useToast();
  const createProject = useCreateProject();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) return;
    setName('');
    setDescription('');
  }, [open]);

  const canSubmit = workspaceId && name.trim().length > 0 && !createProject.isPending;

  async function onSubmit() {
    try {
      await createProject.mutateAsync({
        workspaceId,
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
      });
      toast({ title: 'Project created', description: 'Your project is ready.', variant: 'success' });
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: 'Failed to create project',
        description: e?.response?.data?.message || e?.message || 'Please try again.',
        variant: 'error',
      });
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-card text-card-foreground shadow-lg">
        <div className="p-4 border-b border-border">
          <div className="text-lg font-semibold">Create Project</div>
          <div className="text-sm text-muted-foreground">Create a project inside the current workspace.</div>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Name</div>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Description (optional)</div>
            <textarea
              className="w-full min-h-[96px] rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What’s this project about?"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createProject.isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {createProject.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}

