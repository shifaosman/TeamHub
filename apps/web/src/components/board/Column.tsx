import { useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Task, TaskStatus } from '@/lib/projectsApi';
import { TaskCreateDialog } from './TaskCreateDialog';
import { SortableTaskCard } from './SortableTaskCard';

interface ColumnProps {
  title: string;
  status: TaskStatus;
  projectId: string;
  workspaceId: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function Column({ title, status, projectId, workspaceId, tasks, onTaskClick }: ColumnProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: status });

  const ids = useMemo(() => tasks.map((t) => t._id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={`w-80 shrink-0 rounded-lg border border-border bg-muted/20 flex flex-col min-h-0 ${
        isOver ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{tasks.length} task(s)</div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          + Add
        </Button>
      </div>

      <div className="p-3 space-y-2 overflow-y-auto flex-1 min-h-0">
        {tasks.length === 0 ? (
          <div className="text-sm text-muted-foreground">No tasks.</div>
        ) : (
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableTaskCard key={task._id} task={task} onClick={() => onTaskClick(task)} />
            ))}
          </SortableContext>
        )}
      </div>

      <TaskCreateDialog
        projectId={projectId}
        workspaceId={workspaceId}
        status={status}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}

