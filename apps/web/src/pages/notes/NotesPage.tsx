import { useParams, Link } from 'react-router-dom';
import { NoteList } from '@/components/notes/NoteList';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function NotesPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const { user, logout } = useAuth();
  const effectiveWorkspaceId = workspaceId || currentWorkspace?._id || '';

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
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2">{user?.username}</div>
          <Button onClick={logout} variant="outline" className="w-full">
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Notes</h2>
          {effectiveWorkspaceId && (
            <Link to={`/workspaces/${effectiveWorkspaceId}/notes/new`}>
              <Button>+ New Note</Button>
            </Link>
          )}
        </header>

        <div className="p-6">
          {effectiveWorkspaceId ? (
            <NoteList workspaceId={effectiveWorkspaceId} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Please select a workspace to view notes</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
