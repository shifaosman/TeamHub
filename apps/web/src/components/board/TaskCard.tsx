import { cn } from '@/lib/utils';
import { Task } from '@/lib/projectsApi';
import { differenceInHours, isPast } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  className?: string;
}

export function TaskCard({ task, onClick, className }: TaskCardProps) {
  const due = task.dueAt ? new Date(task.dueAt) : null;
  const isOverdue = due ? isPast(due) : false;
  const dueSoon = due ? !isOverdue && differenceInHours(due, new Date()) <= 24 : false;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-md border border-border bg-card px-3 py-2 shadow-sm hover:bg-muted/50 transition-colors',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium">{task.title}</div>
        {due ? (
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full border',
              isOverdue
                ? 'border-destructive/40 text-destructive bg-destructive/10'
                : dueSoon
                  ? 'border-yellow-500/40 text-yellow-700 bg-yellow-500/10'
                  : 'border-border text-muted-foreground bg-muted/30'
            )}
          >
            {isOverdue ? 'Overdue' : dueSoon ? 'Due soon' : 'Due'}
          </span>
        ) : null}
      </div>
      {task.description ? (
        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</div>
      ) : null}
    </button>
  );
}

