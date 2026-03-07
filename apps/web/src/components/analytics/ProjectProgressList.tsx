import { Link } from 'react-router-dom';
import type { ProjectProgress } from '@/lib/analyticsApi';
import { cn } from '@/lib/utils';

interface ProjectProgressListProps {
  projects: ProjectProgress[];
  className?: string;
}

export function ProjectProgressList({ projects, className }: ProjectProgressListProps) {
  if (projects.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border/60 bg-muted/20 px-4 py-8 text-center', className)}>
        <p className="text-sm text-muted-foreground">No projects yet</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {projects.slice(0, 8).map((p) => (
        <div
          key={p.projectId}
          className="rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-border"
        >
          <div className="flex items-center justify-between gap-2">
            <Link
              to={`/projects/${p.projectId}`}
              className="min-w-0 flex-1 font-medium text-foreground truncate hover:underline"
            >
              {p.projectName}
            </Link>
            <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {p.completedTasks}/{p.totalTasks}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                p.progressPercent === 100 ? 'bg-primary' : 'bg-primary/80'
              )}
              style={{ width: `${Math.min(100, p.progressPercent)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
