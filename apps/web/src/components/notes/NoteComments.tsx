import { useState } from 'react';
import { useNoteComments, useAddComment, useDeleteComment } from '@/hooks/useNotes';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface NoteCommentsProps {
  noteId: string;
}

export function NoteComments({ noteId }: NoteCommentsProps) {
  const { data: comments, isLoading } = useNoteComments(noteId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addComment.mutateAsync({
        noteId,
        content: newComment.trim(),
      });
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment.mutateAsync({ noteId, commentId });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Loading comments...</div>;
  }

  return (
    <div className="border-t border-border p-4">
      <h3 className="font-semibold mb-4">Comments</h3>

      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full px-3 py-2 border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-2"
          rows={3}
        />
        <Button type="submit" size="sm" disabled={!newComment.trim() || addComment.isPending}>
          {addComment.isPending ? 'Posting...' : 'Post Comment'}
        </Button>
      </form>

      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {comment.user?.avatar ? (
                  <img
                    src={comment.user.avatar}
                    alt={comment.user.username}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">
                    {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-foreground">
                    {comment.user?.username || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-foreground/90">{comment.content}</p>
                {comment.user?._id === user?._id && (
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className="text-xs text-red-600 hover:text-red-700 mt-1"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet</p>
        )}
      </div>
    </div>
  );
}
