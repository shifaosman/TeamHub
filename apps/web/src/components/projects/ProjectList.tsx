import { Project } from '@/lib/projectsApi';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        No projects yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {projects.map((p) => (
        <ProjectCard key={p._id} project={p} />
      ))}
    </div>
  );
}

