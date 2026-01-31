import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import {
  useDeleteTask,
  useUpdateTask,
  useUpdateTaskAssignee,
  useUpdateTaskDue,
  useUpdateTaskWatchers,
} from '@/hooks/useTasks';
import { Task, TaskStatus } from '@/lib/projectsApi';
import { CommentsPanel } from './CommentsPanel';
import { useWorkspaceMembers } from '@/hooks/useWorkspaces';
import { useAuth } from '@/contexts/AuthContext';

interface TaskDetailsDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailsDrawer({ task, open, onOpenChange }: TaskDetailsDrawerProps) {
  const { toast } = useToast();
  const updateTask = useUpdateTask();
  const updateAssignee = useUpdateTaskAssignee();
  const updateWatchers = useUpdateTaskWatchers();
  const updateDue = useUpdateTaskDue();
  const deleteTask = useDeleteTask();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(''); // YYYY-MM-DD
  const [dueTime, setDueTime] = useState<string>(''); // HH:mm

  const { data: workspaceMembers } = useWorkspaceMembers(task?.workspaceId || '');

  const assigneeLabel = useMemo(() => {
    if (!assigneeId) return 'Unassigned';
    const members = workspaceMembers as any[] | undefined;
    const found = members?.find((m: any) => {
      const id = typeof m.userId === 'object' && m.userId?._id ? m.userId._id : m.userId;
      return id === assigneeId;
    });
    if (!found) return assigneeId;
    if (typeof found.userId === 'object' && found.userId) {
      return found.userId.username || found.userId.email || assigneeId;
    }
    return assigneeId;
  }, [assigneeId, workspaceMembers]);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title || '');
    setDescription(task.description || '');
    setStatus(task.status || 'todo');
    setAssigneeId(task.assigneeId || '');
    if (task.dueAt) {
      const d = new Date(task.dueAt);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      setDueDate(`${yyyy}-${mm}-${dd}`);
      setDueTime(`${hh}:${mi}`);
    } else {
      setDueDate('');
      setDueTime('');
    }
  }, [task]);

  const canSave = useMemo(() => {
    if (!task) return false;
    if (updateTask.isPending) return false;
    return title.trim().length > 0;
  }, [task, title, updateTask.isPending]);

  async function onSave() {
    if (!task) return;
    try {
      await updateTask.mutateAsync({
        taskId: task._id,
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        status,
      });
      toast({ title: 'Task updated', description: 'Changes saved.', variant: 'success' });
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: 'Failed to update task',
        description: e?.response?.data?.message || e?.message || 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onChangeAssignee(next: string) {
    if (!task) return;
    try {
      const saved = await updateAssignee.mutateAsync({
        taskId: task._id,
        assigneeId: next ? next : null,
      });
      setAssigneeId(saved.assigneeId || '');
      toast({ title: 'Assignee updated', description: 'Saved.', variant: 'success' });
    } catch (e: any) {
      toast({
        title: 'Failed to update assignee',
        description: e?.response?.data?.message || e?.message || 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onToggleWatch() {
    if (!task || !user?._id) return;
    const watcherIds = task.watcherIds || [];
    const isWatching = watcherIds.includes(user._id);
    const next = isWatching ? watcherIds.filter((id) => id !== user._id) : [...watcherIds, user._id];

    try {
      await updateWatchers.mutateAsync({ taskId: task._id, watcherIds: next });
      toast({
        title: isWatching ? 'Unwatched task' : 'Watching task',
        description: isWatching ? 'You will no longer get updates.' : 'You will get status update notifications.',
        variant: 'success',
      });
    } catch (e: any) {
      toast({
        title: 'Failed to update watchers',
        description: e?.response?.data?.message || e?.message || 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onSaveDue() {
    if (!task) return;
    try {
      const dueAt =
        dueDate.trim().length > 0
          ? new Date(`${dueDate}T${dueTime?.trim() ? dueTime.trim() : '00:00'}`).toISOString()
          : null;
      await updateDue.mutateAsync({ taskId: task._id, dueAt });
      toast({ title: 'Due date updated', description: 'Saved.', variant: 'success' });
    } catch (e: any) {
      toast({
        title: 'Failed to update due date',
        description: e?.response?.data?.message || e?.message || 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onClearDue() {
    if (!task) return;
    try {
      await updateDue.mutateAsync({ taskId: task._id, dueAt: null });
      setDueDate('');
      setDueTime('');
      toast({ title: 'Due date cleared', description: 'Saved.', variant: 'success' });
    } catch (e: any) {
      toast({
        title: 'Failed to clear due date',
        description: e?.response?.data?.message || e?.message || 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onDelete() {
    if (!task) return;
    try {
      await deleteTask.mutateAsync(task._id);
      toast({ title: 'Task deleted', description: 'Removed from your board.', variant: 'success' });
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: 'Failed to delete task',
        description: e?.response?.data?.message || e?.message || 'Please try again.',
        variant: 'error',
      });
    }
  }

  if (!open || !task) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-card text-card-foreground border-l border-border shadow-xl overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-lg font-semibold truncate">Task details</div>
            <div className="text-xs text-muted-foreground truncate">{task._id}</div>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {(task.sourceChannelId && task.sourceMessageId) ? (
            <div className="rounded-md border border-border bg-muted/20 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">Source message</div>
                <div className="text-xs text-muted-foreground truncate">
                  Channel: {task.sourceChannelId} · Message: {task.sourceMessageId}
                </div>
              </div>
              <Link to={`/channels/${task.sourceChannelId}#message-${task.sourceMessageId}`}>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </Link>
            </div>
          ) : null}

          <div className="space-y-1">
            <div className="text-sm font-medium">Title</div>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">Watch</div>
              <div className="text-xs text-muted-foreground">Get notified when the status changes.</div>
            </div>
            <Button variant="outline" size="sm" onClick={onToggleWatch} disabled={!user?._id || updateWatchers.isPending}>
              {(task.watcherIds || []).includes(user?._id || '') ? 'Unwatch' : 'Watch'}
            </Button>
          </div>

          <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">Due date</div>
                <div className="text-xs text-muted-foreground">Set a due date for reminders.</div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onClearDue}
                  disabled={updateDue.isPending || (!dueDate && !dueTime)}
                >
                  Clear
                </Button>
                <Button size="sm" onClick={onSaveDue} disabled={updateDue.isPending}>
                  {updateDue.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <input
                type="time"
                step={60}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Description</div>
            <textarea
              className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              <div className="text-sm font-medium">Assignee</div>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                value={assigneeId}
                onChange={(e) => onChangeAssignee(e.target.value)}
                disabled={updateAssignee.isPending}
              >
                <option value="">Unassigned</option>
                {(workspaceMembers || []).map((m: any) => {
                  const id = typeof m.userId === 'object' && m.userId?._id ? m.userId._id : m.userId;
                  const label =
                    typeof m.userId === 'object' && m.userId
                      ? `${m.userId.username || m.userId.email || id}`
                      : id;
                  return (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <div className="text-xs text-muted-foreground truncate">Selected: {assigneeLabel}</div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onDelete} disabled={deleteTask.isPending}>
              {deleteTask.isPending ? 'Deleting…' : 'Delete'}
            </Button>
            <Button onClick={onSave} disabled={!canSave}>
              {updateTask.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>

          <div className="border-t border-border pt-4">
            <CommentsPanel taskId={task._id} projectId={task.projectId} workspaceId={task.workspaceId} />
          </div>
        </div>
      </div>
    </div>
  );
}

