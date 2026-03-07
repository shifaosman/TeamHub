import { cn } from '@/lib/utils';
import { Task, TaskPriority } from '@/lib/projectsApi';
import { differenceInHours, isPast } from 'date-fns';

const priorityColors: Record<TaskPriority, string> = {
  low: 'border-border text-muted-foreground bg-muted/30',
  medium: 'border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-500/10',
  high: 'border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10',
  urgent: 'border-destructive/40 text-destructive bg-destructive/10',
};

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  className?: string;
}

export function TaskCard({ task, onClick, className }: TaskCardProps) {
  const due = task.dueAt ? new Date(task.dueAt) : null;
  const isOverdue = due ? isPast(due) : false;
  const dueSoon = due ? !isOverdue && differenceInHours(due, new Date()) <= 24 : false;
  const priority = (task.priority || 'medium') as TaskPriority;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm transition-colors hover:bg-muted/50',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 text-sm font-medium">{task.title}</div>
        <div className="flex shrink-0 items-center gap-1">
          <span className={cn('rounded border px-1.5 py-0.5 text-[10px] font-medium', priorityColors[priority])}>
            {priority}
          </span>
          {due && (
            <span
              className={cn(
                'text-[10px] rounded border px-1.5 py-0.5',
                isOverdue
                  ? 'border-destructive/40 text-destructive bg-destructive/10'
                  : dueSoon
                    ? 'border-yellow-500/40 text-yellow-700 dark:text-yellow-300 bg-yellow-500/10'
                    : 'border-border text-muted-foreground bg-muted/30'
              )}
            >
              {isOverdue ? 'Overdue' : dueSoon ? 'Soon' : 'Due'}
            </span>
          )}
        </div>
      </div>
      {task.labels && task.labels.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((label) => (
            <span key={label} className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {label}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{task.labels.length - 3}</span>
          )}
        </div>
      )}
      {task.description ? (
        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</div>
      ) : null}
    </button>
  );
}

