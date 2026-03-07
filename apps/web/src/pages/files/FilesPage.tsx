import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useFiles, useUploadFile, useDeleteFile, type FileUpload } from '@/hooks/useFiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload,
  FileText,
  Image,
  Video,
  File as FileIcon,
  Grid3X3,
  List,
  Search,
  FolderOpen,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { FileDetailDrawer } from '@/components/files/FileDetailDrawer';

const MIME_FILTERS = [
  { value: '', label: 'All types' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'document', label: 'Documents' },
] as const;

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Recent' },
  { value: 'updatedAt', label: 'Updated' },
  { value: 'originalName', label: 'Name' },
  { value: 'size', label: 'Size' },
] as const;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('text')) return FileText;
  return FileIcon;
}

export function FilesPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const { toast } = useToast();
  const effectiveWorkspaceId = workspaceId || currentWorkspace?._id || '';

  const [search, setSearch] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [sort, setSort] = useState<'createdAt' | 'updatedAt' | 'originalName' | 'size'>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data, isLoading, isError, error } = useFiles(effectiveWorkspaceId, {
    search: search || undefined,
    mimeType: mimeType || undefined,
    sort,
    order,
    limit: 100,
    offset: 0,
  });

  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();

  const handleUpload = useCallback(
    (files: FileList | null) => {
      if (!effectiveWorkspaceId || !files?.length) return;
      Array.from(files).forEach((file) => {
        uploadFile.mutate(
          { file, workspaceId: effectiveWorkspaceId },
          {
            onSuccess: () => toast({ title: 'File uploaded', description: 'Your file is now in the workspace.', variant: 'success' }),
            onError: (e: any) =>
              toast({
                title: 'Upload failed',
                description: e?.response?.data?.message || e?.message,
                variant: 'error',
              }),
          }
        );
      });
    },
    [effectiveWorkspaceId, uploadFile, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleUpload(e.dataTransfer.files);
    },
    [handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDelete = useCallback(
    (fileId: string) => {
      if (!confirm('Delete this file? This cannot be undone.')) return;
      deleteFile.mutate(fileId, {
        onSuccess: () => {
          setSelectedFileId((id) => (id === fileId ? null : id));
          toast({ title: 'File deleted', description: 'The file has been removed.', variant: 'success' });
        },
        onError: (e: any) =>
          toast({
            title: 'Delete failed',
            description: e?.response?.data?.message || e?.message,
            variant: 'error',
          }),
      });
    },
    [deleteFile, toast]
  );

  if (!effectiveWorkspaceId) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-16 px-6 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Select a workspace to view files.</p>
          <Link to="/dashboard" className="mt-4 text-sm font-medium text-primary hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderOpen className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Files</h1>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              multiple
              className="hidden"
              id="files-page-upload"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploadFile.isPending}
            />
            <Button
              type="button"
              onClick={() => document.getElementById('files-page-upload')?.click()}
              disabled={uploadFile.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadFile.isPending ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-border bg-muted/30"
            />
          </div>
          <select
            value={mimeType}
            onChange={(e) => setMimeType(e.target.value)}
            className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
          >
            {MIME_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={`${sort}-${order}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split('-') as [typeof sort, typeof order];
              setSort(s);
              setOrder(o);
            }}
            className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
          >
            {SORT_OPTIONS.flatMap((opt) => [
              <option key={`${opt.value}-desc`} value={`${opt.value}-desc`}>
                {opt.label} (newest first)
              </option>,
              <option key={`${opt.value}-asc`} value={`${opt.value}-asc`}>
                {opt.label} (oldest first)
              </option>,
            ])}
          </select>
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 hover:bg-muted/50'
              )}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 hover:bg-muted/50'
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drop zone overlay */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'rounded-2xl border-2 border-dashed transition-colors mb-6',
            isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
          )}
        >
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or use the Upload button above.
            </p>
          </div>
        </div>

        {/* Content */}
        {isError && (
          <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
            {error?.message || 'Failed to load files.'}
          </div>
        )}

        {isLoading && (
          <div className={cn(viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'space-y-2')}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={cn(viewMode === 'grid' ? 'aspect-square rounded-2xl' : 'h-16 rounded-xl')} />
            ))}
          </div>
        )}

        {!isLoading && !isError && data && data.files.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-16 px-6 text-center">
            <FileIcon className="h-14 w-14 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No files yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Upload files to share them with your workspace.</p>
            <Button onClick={() => document.getElementById('files-page-upload')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload files
            </Button>
          </div>
        )}

        {!isLoading && !isError && data && data.files.length > 0 && (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                : 'space-y-2'
            )}
          >
            {data.files.map((file) => (
              <FileCard
                key={file._id}
                file={file}
                viewMode={viewMode}
                isSelected={selectedFileId === file._id}
                onSelect={() => setSelectedFileId(file._id)}
              />
            ))}
          </div>
        )}
      </div>

      <FileDetailDrawer
        fileId={selectedFileId}
        workspaceId={effectiveWorkspaceId}
        onClose={() => setSelectedFileId(null)}
        onDelete={handleDelete}
      />
    </MainLayout>
  );
}

interface FileCardProps {
  file: FileUpload;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
}

function FileCard({ file, viewMode, isSelected, onSelect }: FileCardProps) {
  const Icon = getFileIcon(file.mimeType);
  const uploader = file.uploader ?? file.user;

  if (viewMode === 'list') {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all hover:bg-muted/50',
          isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card'
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground truncate">{file.originalName}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)} · {uploader?.username ?? 'Unknown'} · {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-col rounded-2xl border p-4 text-left transition-all hover:bg-muted/50 hover:shadow-md',
        isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card shadow-sm'
      )}
    >
      <div className="flex h-24 w-full items-center justify-center rounded-xl bg-muted/50 mb-3">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <p className="font-medium text-foreground text-sm truncate" title={file.originalName}>
        {file.originalName}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {formatFileSize(file.size)} · {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
      </p>
    </button>
  );
}
