import { useState, useRef, useEffect } from 'react';
import { useCreateMessage } from '@/hooks/useMessages';
import { useSocket } from '@/hooks/useSocket';
import { useUploadFile } from '@/hooks/useFiles';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/files/FileUpload';

interface MessageInputProps {
  channelId: string;
  threadId?: string;
  replyToId?: string;
}

export function MessageInput({ channelId, threadId, replyToId }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createMessage = useCreateMessage();
  const uploadFile = useUploadFile();
  const socket = useSocket();
  const { currentWorkspace } = useWorkspaceStore();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

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

  const handleFileUpload = async (file: any) => {
    setAttachedFiles((prev) => [...prev, file._id]);
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
        attachments: attachedFiles.length > 0 ? attachedFiles : undefined,
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
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
      {attachedFiles.length > 0 && (
        <div className="mb-2 flex gap-2 flex-wrap">
          {attachedFiles.map((fileId) => (
            <div key={fileId} className="text-xs bg-gray-100 px-2 py-1 rounded">
              File attached
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
