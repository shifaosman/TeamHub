import { useFilePreview } from '@/hooks/useFiles';

interface FilePreviewProps {
  fileId: string;
  showDetails?: boolean;
}

export function FilePreview({ fileId, showDetails = true }: FilePreviewProps) {
  const { data: preview, isLoading } = useFilePreview(fileId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading preview...</div>;
  }

  if (!preview) {
    return null;
  }

  if (preview.isImage) {
    return (
      <div className="max-w-md">
        <img
          src={preview.url}
          alt="File preview"
          className="max-w-full h-auto rounded-lg border border-border"
        />
        {showDetails && (
          <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline mt-2 block"
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
        <video controls className="max-w-full rounded-lg border border-border">
          <source src={preview.url} type={preview.mimeType} />
          Your browser does not support the video tag.
        </video>
        {showDetails && (
          <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline mt-2 block"
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
            className="text-sm text-primary hover:underline mt-2 block"
          >
            Download
          </a>
        )}
      </div>
    );
  }

  // Document or other file type
  return (
    <div className="border border-border rounded-lg p-4 bg-muted/20">
      <div className="flex items-center gap-3">
        <div className="text-3xl">📄</div>
        <div className="flex-1">
          <p className="font-medium text-foreground">{preview.mimeType}</p>
          {showDetails && (
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Download file
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
