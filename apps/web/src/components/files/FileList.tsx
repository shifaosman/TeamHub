import { useFiles } from '@/hooks/useFiles';
import { formatDistanceToNow } from 'date-fns';
import { FilePreview } from './FilePreview';

interface FileListProps {
  workspaceId: string;
  channelId?: string;
}

export function FileList({ workspaceId, channelId }: FileListProps) {
  const { data, isLoading } = useFiles(workspaceId, channelId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Loading files...</div>;
  }

  if (!data || data.files.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">No files yet</p>
      </div>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('word')) return '📘';
    if (mimeType.includes('excel')) return '📗';
    if (mimeType.includes('powerpoint')) return '📙';
    return '📄';
  };

  return (
    <div className="space-y-2">
      {data.files.map((file) => (
        <div
          key={file._id}
          className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">{getFileIcon(file.mimeType)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <a
                  href={`/files/${file._id}/download`}
                  className="font-medium text-foreground hover:text-primary truncate"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {file.originalName}
                </a>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>
                  {file.user?.username || 'Unknown'} •{' '}
                  {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                </span>
              </div>
              {(file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/')) && (
                <div className="mt-2">
                  <FilePreview fileId={file._id} showDetails={false} />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
