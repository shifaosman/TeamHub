import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ProjectCreateDialog } from '@/components/projects/ProjectCreateDialog';
import { ProjectList } from '@/components/projects/ProjectList';
import { useProjects } from '@/hooks/useProjects';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export function ProjectsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const workspaceId = currentWorkspace?._id || '';

  const [createOpen, setCreateOpen] = useState(false);
  const { data: projects, isLoading, error } = useProjects(workspaceId);

  return (
    <MainLayout>
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Projects {currentWorkspace ? <span className="text-muted-foreground">· {currentWorkspace.name}</span> : null}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Trello-style boards for your workspace.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} disabled={!workspaceId}>
            + New Project
          </Button>
        </div>
      </header>

      <div className="p-6">
        {!workspaceId ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            Select a workspace to view projects.
          </div>
        ) : error ? (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-destructive text-sm">Error loading projects: {(error as any)?.message}</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading projects...</p>
          </div>
        ) : (
          <ProjectList projects={projects || []} />
        )}
      </div>

      {workspaceId && (
        <ProjectCreateDialog workspaceId={workspaceId} open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </MainLayout>
  );
}

