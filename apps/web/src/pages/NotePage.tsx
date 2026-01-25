import { useParams, Link } from 'react-router-dom';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { NoteComments } from '@/components/notes/NoteComments';
import { useNote, useNoteVersions } from '@/hooks/useNotes';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function NotePage() {
  const { noteId } = useParams<{ noteId: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const { user, logout } = useAuth();
  const { data: note } = useNote(noteId || '');
  const { data: versions } = useNoteVersions(noteId || '');
  const [showVersions, setShowVersions] = useState(false);

  if (!noteId || !currentWorkspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">TeamHub</h1>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
        </aside>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Select a note to view</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">TeamHub</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 mb-4 block">
            ← Back to Dashboard
          </Link>
          {currentWorkspace && (
            <Link
              to={`/workspaces/${currentWorkspace._id}/notes`}
              className="text-sm text-gray-600 hover:text-gray-900 mb-4 block"
            >
              📝 All Notes
            </Link>
          )}
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2">{user?.username}</div>
          <Button onClick={logout} variant="outline" className="w-full">
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{note?.title || 'Note'}</h2>
            {note?.updatedByUser && (
              <p className="text-sm text-gray-600 mt-1">
                Last edited by {note.updatedByUser.username}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersions(!showVersions)}
            >
              {showVersions ? 'Hide' : 'Show'} Versions ({versions?.length || 0})
            </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
            <NoteEditor noteId={noteId} />
            <NoteComments noteId={noteId} />
          </div>

          {showVersions && versions && versions.length > 0 && (
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-4">
              <h3 className="font-semibold mb-4">Version History</h3>
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version._id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1">{version.title}</div>
                    <div className="text-xs text-gray-500">
                      {version.createdByUser?.username || 'Unknown'} •{' '}
                      {new Date(version.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
