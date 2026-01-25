import { Link } from 'react-router-dom';
import { useNotes } from '@/hooks/useNotes';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface NoteListProps {
  workspaceId: string;
  parentId?: string;
}

export function NoteList({ workspaceId, parentId }: NoteListProps) {
  const { data: notes, isLoading } = useNotes(workspaceId, parentId);

  if (isLoading) {
    return <div className="text-sm text-gray-500 p-4">Loading notes...</div>;
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm mb-2">No notes yet</p>
        <Link to={`/workspaces/${workspaceId}/notes/new`}>
          <Button size="sm">Create Note</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <Link
          key={note._id}
          to={`/notes/${note._id}`}
          className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <h3 className="font-semibold text-gray-900 mb-1">{note.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {note.content.substring(0, 100)}
            {note.content.length > 100 ? '...' : ''}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              {note.updatedByUser?.username || 'Unknown'} •{' '}
              {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
