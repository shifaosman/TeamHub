import { useState, useRef, useEffect, useMemo } from 'react';
import { useCreateMessage } from '@/hooks/useMessages';
import { useSocket } from '@/hooks/useSocket';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useWorkspaceMembers } from '@/hooks/useWorkspaces';
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
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createMessage = useCreateMessage();
  const socket = useSocket();
  const { currentWorkspace } = useWorkspaceStore();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: membersData } = useWorkspaceMembers(currentWorkspace?._id || '');
  const members = useMemo(() => {
    const list = membersData as Array<{ userId: { _id: string; username: string } }> | undefined;
    if (!list) return [];
    return list
      .map((m: any) => (typeof m.userId === 'object' && m.userId?.username ? { id: m.userId._id, username: m.userId.username } : null))
      .filter(Boolean) as { id: string; username: string }[];
  }, [membersData]);

  const mentionQuery = mentionStart != null ? (content.slice(mentionStart + 1).split(/\s/)[0] ?? '') : '';
  const filteredMembers = useMemo(() => {
    if (!mentionQuery) return members.slice(0, 8);
    const q = mentionQuery.toLowerCase();
    return members.filter((m) => m.username.toLowerCase().startsWith(q)).slice(0, 8);
  }, [members, mentionQuery]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  useEffect(() => {
    setSelectedMentionIndex(0);
  }, [filteredMembers.length]);

  const emitTyping = () => {
    if (!socket) return;
    socket.emit('message:typing', { channelId, threadId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(
      () => socket?.emit('message:typing', { channelId, threadId, isTyping: false }),
      3000
    );
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    const pos = e.target.selectionStart ?? v.length;
    setContent(v);
    const textBeforeCaret = v.slice(0, pos);
    const lastAt = textBeforeCaret.lastIndexOf('@');
    if (lastAt !== -1) {
      const afterAt = textBeforeCaret.slice(lastAt + 1);
      if (!/\s/.test(afterAt)) {
        setMentionStart(lastAt);
        emitTyping();
        return;
      }
    }
    setMentionStart(null);
    emitTyping();
  };

  const insertMention = (username: string) => {
    if (mentionStart == null || !textareaRef.current) return;
    const before = content.slice(0, mentionStart);
    const after = content.slice(mentionStart + 1 + mentionQuery.length);
    setContent(`${before}@${username} ${after}`);
    setMentionStart(null);
    setTimeout(() => {
      textareaRef.current?.focus();
      const pos = before.length + username.length + 2;
      textareaRef.current?.setSelectionRange(pos, pos);
    }, 0);
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
    if (mentionStart != null && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((i) => (i + 1) % filteredMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((i) => (i - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMembers[selectedMentionIndex].username);
        return;
      }
      if (e.key === 'Escape') setMentionStart(null);
    }
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
      <div className="relative flex flex-1 items-end gap-2 p-4">
        <div className="flex-1">
          {mentionStart != null && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-4 right-24 z-10 mb-1 max-h-48 overflow-auto rounded-lg border border-border bg-popover py-1 shadow-lg">
              {filteredMembers.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted ${i === selectedMentionIndex ? 'bg-muted' : ''}`}
                  onClick={() => insertMention(m.username)}
                >
                  <span className="font-medium text-foreground">@{m.username}</span>
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (use @ to mention)"
            className="min-h-[40px] w-full max-h-[200px] resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
