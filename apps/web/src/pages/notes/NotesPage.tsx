import { useParams, Link } from 'react-router-dom';
import { NoteList } from '@/components/notes/NoteList';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';

export function NotesPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const effectiveWorkspaceId = workspaceId || currentWorkspace?._id || '';

  return (
    <MainLayout>
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold text-foreground">Notes</h2>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Dashboard
            </Link>
          </div>
          {effectiveWorkspaceId && (
            <Link to={`/workspaces/${effectiveWorkspaceId}/notes/new`}>
              <Button>+ New Note</Button>
            </Link>
          )}
        </div>
      </header>

      <div className="p-6">
        {effectiveWorkspaceId ? (
          <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-4">
            <NoteList workspaceId={effectiveWorkspaceId} />
          </div>
        ) : (
          <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-12 text-center">
            <p className="text-muted-foreground">Please select a workspace to view notes.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
