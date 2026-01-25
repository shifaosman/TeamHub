import { useFilePreview } from '@/hooks/useFiles';
import { formatDistanceToNow } from 'date-fns';

interface FilePreviewProps {
  fileId: string;
  showDetails?: boolean;
}

export function FilePreview({ fileId, showDetails = true }: FilePreviewProps) {
  const { data: preview, isLoading } = useFilePreview(fileId);

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading preview...</div>;
  }

  if (!preview) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (preview.isImage) {
    return (
      <div className="max-w-md">
        <img
          src={preview.url}
          alt="File preview"
          className="max-w-full h-auto rounded-lg border border-gray-200"
        />
        {showDetails && (
          <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline mt-2 block"
          >
            Open in new tab
          </a>
        )}
      </div>
    );
  }

  if (preview.isVideo) {
    return (
      <div className="max-w-md">
        <video controls className="max-w-full rounded-lg border border-gray-200">
          <source src={preview.url} type={preview.mimeType} />
          Your browser does not support the video tag.
        </video>
        {showDetails && (
          <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline mt-2 block"
          >
            Open in new tab
          </a>
        )}
      </div>
    );
  }

  if (preview.isAudio) {
    return (
      <div className="max-w-md">
        <audio controls className="w-full">
          <source src={preview.url} type={preview.mimeType} />
          Your browser does not support the audio tag.
        </audio>
        {showDetails && (
          <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline mt-2 block"
          >
            Download
          </a>
        )}
      </div>
    );
  }

  // Document or other file type
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="text-3xl">📄</div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{preview.mimeType}</p>
          {showDetails && (
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Download file
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
