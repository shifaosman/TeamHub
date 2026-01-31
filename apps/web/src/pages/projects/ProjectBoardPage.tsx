import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Board } from '@/components/board/Board';
import { useProject } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useActivity } from '@/hooks/useActivity';
import { ActivityFeed } from '@/components/activity/ActivityFeed';

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentWorkspace } = useWorkspaceStore();

  const effectiveProjectId = projectId || '';
  const projectQuery = useProject(effectiveProjectId);
  const tasksQuery = useTasks(effectiveProjectId);
  const activityQuery = useActivity({ projectId: effectiveProjectId, limit: 30 });

  const workspaceName = currentWorkspace?.name;

  const workspaceId = useMemo(() => {
    return projectQuery.data?.workspaceId || currentWorkspace?._id || '';
  }, [projectQuery.data?.workspaceId, currentWorkspace?._id]);

  const taskId = searchParams.get('taskId');

  useEffect(() => {
    // If projectId changes, clear any stale taskId
    if (!effectiveProjectId) return;
    // no-op for now; kept for future cleanup behaviors
  }, [effectiveProjectId, searchParams, setSearchParams]);

  return (
    <MainLayout>
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="text-sm text-muted-foreground">
            {workspaceName ? workspaceName : 'Workspace'} · Projects
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            {projectQuery.isLoading ? 'Loading…' : projectQuery.data?.name || 'Project Board'}
          </h2>
          {projectQuery.data?.description ? (
            <p className="text-sm text-muted-foreground mt-1">{projectQuery.data.description}</p>
          ) : null}
        </div>
      </header>

      <div className="p-6">
        {!effectiveProjectId ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            Missing project id.
          </div>
        ) : projectQuery.error ? (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-destructive text-sm">Error loading project.</p>
          </div>
        ) : tasksQuery.error ? (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-destructive text-sm">Error loading tasks.</p>
          </div>
        ) : projectQuery.isLoading || tasksQuery.isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading board…</p>
          </div>
        ) : !workspaceId ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            Select a workspace to view this project.
          </div>
        ) : (
          <div className="space-y-6">
            <Board
              projectId={effectiveProjectId}
              workspaceId={workspaceId}
              tasks={tasksQuery.data || []}
              initialOpenTaskId={taskId}
            />

            <div className="rounded-lg border border-border bg-muted/10 p-4">
              <div className="text-sm font-semibold mb-3">Activity</div>
              <ActivityFeed
                workspaceId={workspaceId}
                items={activityQuery.data || []}
                isLoading={activityQuery.isLoading}
                error={activityQuery.error}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

