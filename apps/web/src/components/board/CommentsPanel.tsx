import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useComments, useCreateComment, useDeleteComment } from '@/hooks/useComments';

interface CommentsPanelProps {
  taskId: string;
  projectId: string;
  workspaceId: string;
}

export function CommentsPanel({ taskId, projectId, workspaceId }: CommentsPanelProps) {
  const { toast } = useToast();
  const { data, isLoading, error } = useComments(taskId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const [body, setBody] = useState('');

  const comments = useMemo(() => data || [], [data]);

  async function onAdd() {
    const text = body.trim();
    if (!text) return;

    try {
      await createComment.mutateAsync({ taskId, projectId, workspaceId, body: text });
      setBody('');
    } catch (e: any) {
      toast({
        title: 'Failed to add comment',
        description: e?.response?.data?.message || e?.message || 'Please try again.',
        variant: 'error',
      });
    }
  }

  async function onDelete(commentId: string) {
    try {
      await deleteComment.mutateAsync({ commentId, taskId });
    } catch (e: any) {
      toast({
        title: 'Failed to delete comment',
        description: e?.response?.data?.message || e?.message || 'Please try again.',
        variant: 'error',
      });
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Comments</div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading comments…</div>
        ) : error ? (
          <div className="text-sm text-destructive">Failed to load comments.</div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-muted-foreground">No comments yet.</div>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="rounded-md border border-border bg-background px-3 py-2">
              <div className="text-sm whitespace-pre-wrap">{c.body}</div>
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(c._id)}
                  disabled={deleteComment.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <textarea
          className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
        />
        <div className="flex justify-end">
          <Button onClick={onAdd} disabled={!body.trim() || createComment.isPending}>
            {createComment.isPending ? 'Adding…' : 'Add comment'}
          </Button>
        </div>
      </div>
    </div>
  );
}

