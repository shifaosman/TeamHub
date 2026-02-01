import { useParams, Link } from 'react-router-dom';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { NoteComments } from '@/components/notes/NoteComments';
import { useNote, useNoteVersions } from '@/hooks/useNotes';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';

export function NotePage() {
  const { noteId } = useParams<{ noteId: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const { data: note } = useNote(noteId || '');
  const { data: versions } = useNoteVersions(noteId || '');
  const [showVersions, setShowVersions] = useState(false);

  if (!noteId || !currentWorkspace) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-12 text-center">
            <div className="text-muted-foreground">Select a note to view.</div>
            <div className="mt-4">
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-foreground truncate">{note?.title || 'Note'}</h2>
            <div className="flex items-center gap-3 text-sm">
              <Link
                to={`/workspaces/${currentWorkspace._id}/notes`}
                className="text-muted-foreground hover:text-foreground"
              >
                ← All Notes
              </Link>
              {note?.updatedByUser && (
                <span className="text-muted-foreground truncate">
                  Last edited by {note.updatedByUser.username}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowVersions(!showVersions)}>
              {showVersions ? 'Hide' : 'Show'} Versions ({versions?.length || 0})
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 bg-card text-card-foreground border-b border-border overflow-hidden">
            <NoteEditor noteId={noteId} />
          </div>
          <div className="bg-card text-card-foreground">
            <NoteComments noteId={noteId} />
          </div>
        </div>

        {showVersions && versions && versions.length > 0 && (
          <div className="w-80 bg-card text-card-foreground border-l border-border overflow-y-auto p-4">
            <h3 className="font-semibold mb-4">Version History</h3>
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version._id}
                  className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="text-sm font-medium text-foreground mb-1">{version.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {version.createdByUser?.username || 'Unknown'} • {new Date(version.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
