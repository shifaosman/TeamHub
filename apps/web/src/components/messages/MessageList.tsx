import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMessages } from '@/hooks/useMessages';
import { format } from 'date-fns';
import { useSocket } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { FilePreview } from '@/components/files/FilePreview';
import { Button } from '@/components/ui/button';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { CreateTaskFromMessageDialog } from './CreateTaskFromMessageDialog';

interface MessageListProps {
  channelId: string;
}

export function MessageList({ channelId }: MessageListProps) {
  const { data: messages, isLoading } = useMessages(channelId);
  const socket = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const location = useLocation();
  const { currentWorkspace } = useWorkspaceStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const selectedMessage = useMemo(() => {
    return messages?.find((m) => m._id === selectedMessageId) || null;
  }, [messages, selectedMessageId]);

  useEffect(() => {
    if (socket && channelId) {
      socket.emit('join:channel', { channelId });

      const handleNewMessage = () => {
        // Invalidate messages query to refetch
        queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      };

      const handleNotification = () => {
        // Invalidate notifications query
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      };

      socket.on('message:new', handleNewMessage);
      socket.on('notification:new', handleNotification);

      return () => {
        socket.emit('leave:channel', { channelId });
        socket.off('message:new', handleNewMessage);
        socket.off('notification:new', handleNotification);
      };
    }
  }, [socket, channelId]);

  useEffect(() => {
    if (!messages || messages.length === 0) return;

    // If a URL hash targets a specific message, scroll to it.
    if (location.hash && location.hash.startsWith('#message-')) {
      const el = document.querySelector(location.hash);
      if (el) {
        (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // Default behavior: scroll to bottom for new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, location.hash]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No messages yet</p>
          <p className="text-sm">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div key={message._id} id={`message-${message._id}`} className="flex gap-3 group">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {message.user?.avatar ? (
              <img src={message.user.avatar} alt={message.user.username} className="w-full h-full rounded-full" />
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {message.user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-foreground">{message.user?.username || 'Unknown'}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(message.createdAt), 'h:mm a')}
              </span>
              {message.editedAt && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
              <div className="flex-1" />
              {currentWorkspace && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setSelectedMessageId(message._id);
                    setCreateOpen(true);
                  }}
                >
                  Create task
                </Button>
              )}
            </div>
            <p className="text-foreground/90 mt-1 whitespace-pre-wrap break-words">{message.content}</p>
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((fileId: string) => (
                  <FilePreview key={fileId} fileId={fileId} />
                ))}
              </div>
            )}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex gap-1 mt-2">
                {message.reactions.map((reaction, idx) => (
                  <button
                    key={idx}
                    className="px-2 py-1 text-xs bg-muted rounded-full hover:bg-muted/80"
                  >
                    {reaction.emoji} {reaction.userIds.length}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />

      {currentWorkspace && selectedMessage && (
        <CreateTaskFromMessageDialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) setSelectedMessageId(null);
          }}
          workspaceId={currentWorkspace._id}
          message={selectedMessage}
        />
      )}
    </div>
  );
}
