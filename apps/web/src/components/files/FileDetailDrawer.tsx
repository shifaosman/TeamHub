import { useState } from 'react';
import {
  useFileDetails,
  useFileComments,
  useAddFileComment,
  useFilePreview,
} from '@/hooks/useFiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  X,
  Download,
  Trash2,
  MessageSquare,
  FileText,
  File as FileIcon,
  Send,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FileDetailDrawerProps {
  fileId: string | null;
  workspaceId: string;
  onClose: () => void;
  onDelete: (fileId: string) => void;
}

// workspaceId reserved for future folder/workspace context

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function FileDetailDrawer({ fileId, onClose, onDelete }: FileDetailDrawerProps) {
  const [commentText, setCommentText] = useState('');

  const { data: details, isLoading: detailsLoading } = useFileDetails(fileId);
  const { data: comments = [], isLoading: commentsLoading } = useFileComments(fileId);
  const { data: preview } = useFilePreview(fileId ?? '');
  const addComment = useAddFileComment(fileId);

  if (!fileId) return null;

  const handleAddComment = () => {
    if (!commentText.trim() || addComment.isPending) return;
    addComment.mutate(commentText.trim(), {
      onSuccess: () => setCommentText(''),
    });
  };

  const downloadUrl = details?.previewUrl ?? preview?.url;
  const handleDownload = () => {
    if (!downloadUrl) return;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', details?.originalName ?? 'file');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg border-l border-border bg-card shadow-xl flex flex-col"
        role="dialog"
        aria-label="File details"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {details?.originalName ?? 'File details'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {detailsLoading && (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          )}

          {!detailsLoading && details && (
            <>
              {/* Preview */}
              <div className="rounded-2xl border border-border bg-muted/20 overflow-hidden">
                {preview?.isImage && preview?.url && (
                  <img
                    src={preview.url}
                    alt={details.originalName}
                    className="w-full max-h-72 object-contain"
                  />
                )}
                {preview?.isVideo && preview?.url && (
                  <video controls className="w-full max-h-72" src={preview.url} />
                )}
                {preview?.isDocument && (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <FileText className="h-14 w-14 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Preview not available</p>
                    {downloadUrl && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                )}
                {preview && !preview.isImage && !preview.isVideo && !preview.isDocument && (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <FileIcon className="h-14 w-14 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">{details.mimeType}</p>
                    {downloadUrl && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                )}
                {!preview && (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <FileIcon className="h-14 w-14 text-muted-foreground mb-2" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Size</span>
                  <span className="text-foreground font-medium">{formatFileSize(details.size)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="text-foreground font-medium">{details.mimeType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uploaded</span>
                  <span className="text-foreground font-medium">
                    {formatDistanceToNow(new Date(details.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">By</span>
                  <span className="text-foreground font-medium">
                    {details.uploader?.username ?? details.user?.username ?? 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleDownload}
                  disabled={!downloadUrl}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDelete(details._id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>

              {/* Comments */}
              <div className="rounded-2xl border border-border bg-muted/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Comments</span>
                  {comments.length > 0 && (
                    <span className="text-xs text-muted-foreground">({comments.length})</span>
                  )}
                </div>
                <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
                  {commentsLoading && (
                    <Skeleton className="h-16 w-full rounded-xl" />
                  )}
                  {!commentsLoading && comments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                  )}
                  {!commentsLoading &&
                    comments.map((c) => (
                      <div key={c._id} className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {c.user?.username?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">
                            {c.user?.username ?? 'Unknown'} · {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                          </p>
                          <p className="text-sm text-foreground mt-0.5 break-words">{c.content}</p>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="p-3 border-t border-border flex gap-2">
                  <Input
                    placeholder="Add a comment…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                    className="rounded-xl flex-1"
                  />
                  <Button
                    size="icon"
                    className="rounded-xl shrink-0"
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || addComment.isPending}
                    aria-label="Send comment"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
