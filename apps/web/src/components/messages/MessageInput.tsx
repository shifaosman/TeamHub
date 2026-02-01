import { useState, useRef, useEffect } from 'react';
import { useCreateMessage } from '@/hooks/useMessages';
import { useSocket } from '@/hooks/useSocket';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/files/FileUpload';
import { FilePreview } from '@/components/files/FilePreview';
import { X } from 'lucide-react';
import type { FileUpload as FileUploadType } from '@/hooks/useFiles';

interface MessageInputProps {
  channelId: string;
  threadId?: string;
  replyToId?: string;
}

export function MessageInput({ channelId, threadId, replyToId }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileUploadType[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createMessage = useCreateMessage();
  const socket = useSocket();
  const { currentWorkspace } = useWorkspaceStore();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Send typing indicator
    if (socket) {
      socket.emit('message:typing', { channelId, threadId });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (socket) {
          socket.emit('message:typing', { channelId, threadId, isTyping: false });
        }
      }, 3000);
    }
  };

  const handleFileUpload = async (file: FileUploadType) => {
    setAttachedFiles((prev) => [...prev, file]);
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f._id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && attachedFiles.length === 0) return;

    try {
      await createMessage.mutateAsync({
        channelId,
        content: content.trim() || undefined,
        threadId,
        replyToId,
        attachments: attachedFiles.length > 0 ? attachedFiles.map((f) => f._id) : undefined,
      });
      setContent('');
      setAttachedFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-background">
      {attachedFiles.length > 0 && (
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {attachedFiles.length} file{attachedFiles.length > 1 ? 's' : ''} attached
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {attachedFiles.map((file) => (
              <div
                key={file._id}
                className="relative group border border-border rounded-lg p-2 bg-card text-card-foreground"
              >
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file._id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove file"
                >
                  <X className="h-3 w-3" />
                </button>
                <FilePreview fileId={file._id} showDetails={false} />
                <div className="mt-1 text-xs text-muted-foreground truncate">{file.originalName}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="p-4 flex gap-2 items-end">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full resize-none rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={1}
          />
        </div>
        <div className="flex gap-2">
          {currentWorkspace && (
            <FileUpload
              workspaceId={currentWorkspace._id}
              channelId={channelId}
              onUploadComplete={handleFileUpload}
              disabled={createMessage.isPending}
            />
          )}
          <Button
            type="submit"
            disabled={(!content.trim() && attachedFiles.length === 0) || createMessage.isPending}
          >
            Send
          </Button>
        </div>
      </div>
    </form>
  );
}
