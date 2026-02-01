import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useCreateTask } from '@/hooks/useTasks';
import { TaskStatus } from '@/lib/projectsApi';

interface TaskCreateDialogProps {
  projectId: string;
  workspaceId: string;
  status: TaskStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskCreateDialog({
  projectId,
  workspaceId,
  status,
  open,
  onOpenChange,
}: TaskCreateDialogProps) {
  const { toast } = useToast();
  const createTask = useCreateTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) return;
    setTitle('');
    setDescription('');
  }, [open]);

  const canSubmit = title.trim().length > 0 && !createTask.isPending;

  async function onSubmit() {
    try {
      await createTask.mutateAsync({
        projectId,
        workspaceId,
        title: title.trim(),
        description: description.trim() ? description.trim() : undefined,
        status,
      });
      toast({ title: 'Task created', description: 'Added to your board.', variant: 'success' });
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: 'Failed to create task',
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
          <div className="text-lg font-semibold">Add Task</div>
          <div className="text-sm text-muted-foreground">Create a task in this column.</div>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Title</div>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement drag & drop"
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Description (optional)</div>
            <textarea
              className="w-full min-h-[96px] rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details..."
            />
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createTask.isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {createTask.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}

