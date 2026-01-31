import { Link } from 'react-router-dom';
import { Project } from '@/lib/projectsApi';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Link
      to={`/projects/${project._id}`}
      className={cn(
        'block rounded-lg border border-border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors',
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold truncate">{project.name}</div>
            {project.description ? (
              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</div>
            ) : (
              <div className="text-sm text-muted-foreground mt-1">No description</div>
            )}
          </div>
          <div className="text-xs text-muted-foreground shrink-0">
            {project.members?.length ?? 0} member(s)
          </div>
        </div>
      </div>
    </Link>
  );
}

