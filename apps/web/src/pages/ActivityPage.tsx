import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Activity } from 'lucide-react';

export function ActivityPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const effectiveWorkspaceId = workspaceId || currentWorkspace?._id || '';

  return (
    <MainLayout>
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Activity</h1>
                <Link
                  to="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {effectiveWorkspaceId ? (
          <ActivityTimeline workspaceId={effectiveWorkspaceId} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-16 px-6 text-center">
            <p className="text-muted-foreground">Select a workspace to view activity.</p>
            <Link
              to="/dashboard"
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
