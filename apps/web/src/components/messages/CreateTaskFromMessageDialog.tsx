import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useProjects } from '@/hooks/useProjects';
import { useWorkspaceMembers } from '@/hooks/useWorkspaces';
import { useCreateTaskFromMessage } from '@/hooks/useTasks';
import { TaskStatus } from '@/lib/projectsApi';
import type { Message } from '@/hooks/useMessages';

interface CreateTaskFromMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  message: Message;
}

function defaultTitleFromMessage(content: string) {
  const trimmed = (content || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'Task from message';
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
}

export function CreateTaskFromMessageDialog({
  open,
  onOpenChange,
  workspaceId,
  message,
}: CreateTaskFromMessageDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: projects, isLoading: projectsLoading } = useProjects(workspaceId);
  const { data: members, isLoading: membersLoading } = useWorkspaceMembers(workspaceId);
  const create = useCreateTaskFromMessage();

  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [assigneeId, setAssigneeId] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    setTitle(defaultTitleFromMessage(message.content));
    setStatus('todo');
    setAssigneeId('');
    setProjectId('');
  }, [open, message.content]);

  const canSubmit = useMemo(() => {
    return !!workspaceId && !!message._id && !!projectId && title.trim().length > 0 && !create.isPending;
  }, [workspaceId, message._id, projectId, title, create.isPending]);

  async function onSubmit() {
    try {
      const created = await create.mutateAsync({
        messageId: message._id,
        projectId,
        title: title.trim(),
        status,
        assigneeId: assigneeId.trim() ? assigneeId.trim() : null,
      });

      toast({ title: 'Task created', description: 'Created from message.', variant: 'success' });
      onOpenChange(false);
      navigate(`/projects/${projectId}?taskId=${created._id}`);
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
          <div className="text-lg font-semibold">Create task</div>
          <div className="text-sm text-muted-foreground">
            Convert this message into a task.
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Project</div>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={projectsLoading}
            >
              <option value="" disabled>
                {projectsLoading ? 'Loading projects…' : 'Select a project'}
              </option>
              {(projects || []).map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Title</div>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Status</div>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                <option value="todo">todo</option>
                <option value="in-progress">in-progress</option>
                <option value="done">done</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Assignee (optional)</div>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                disabled={membersLoading}
              >
                <option value="">
                  {membersLoading ? 'Loading members…' : 'Unassigned'}
                </option>
                {(members || []).map((m: any) => {
                  const id = typeof m.userId === 'object' && m.userId?._id ? m.userId._id : m.userId;
                  const label =
                    typeof m.userId === 'object' && m.userId
                      ? m.userId.username || m.userId.email || id
                      : id;
                  return (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="rounded-md border border-border bg-muted/20 p-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Message
            </div>
            <div className="mt-1 text-sm whitespace-pre-wrap break-words">
              {message.content || '(no text)'}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {create.isPending ? 'Creating…' : 'Create task'}
          </Button>
        </div>
      </div>
    </div>
  );
}

