import { useRef, useState } from 'react';
import { useUploadFile } from '@/hooks/useFiles';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  workspaceId: string;
  channelId?: string;
  onUploadComplete?: (file: any) => void;
  disabled?: boolean;
}

export function FileUpload({ workspaceId, channelId, onUploadComplete, disabled }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFile = useUploadFile();
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadedFile = await uploadFile.mutateAsync({
        file,
        workspaceId,
        channelId,
      });
      onUploadComplete?.(uploadedFile);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
      >
        {uploading ? 'Uploading...' : '📎 Attach File'}
      </Button>
    </div>
  );
}
