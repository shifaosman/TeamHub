import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMessages, useThreadMessages, useAddReaction } from '@/hooks/useMessages';
import { MessageContent } from './MessageContent';
import { format } from 'date-fns';
import { useSocket } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { FilePreview } from '@/components/files/FilePreview';
import { Button } from '@/components/ui/button';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { CreateTaskFromMessageDialog } from './CreateTaskFromMessageDialog';
import { MessageInput } from './MessageInput';
import { X, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const REACTION_EMOJIS = ['👍', '❤️', '🎉', '👀', '🔥', '✅'];

interface MessageListProps {
  channelId: string;
}

export function MessageList({ channelId }: MessageListProps) {
  const { data: messages, isLoading } = useMessages(channelId);
  const addReaction = useAddReaction();
  const socket = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const location = useLocation();
  const { currentWorkspace } = useWorkspaceStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [threadRootId, setThreadRootId] = useState<string | null>(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null);

  const selectedMessage = useMemo(() => messages?.find((m) => m._id === selectedMessageId) ?? null, [messages, selectedMessageId]);
  const threadMessages = useThreadMessages(threadRootId);

  useEffect(() => {
    if (socket && channelId) {
      socket.emit('join:channel', { channelId });

      const handleNewMessage = () => {
        queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      };

      const handleReaction = () => {
        queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
        queryClient.invalidateQueries({ queryKey: ['messages', 'thread'] });
      };

      const handleNotification = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      };

      socket.on('message:new', handleNewMessage);
      socket.on('message:reaction', handleReaction);
      socket.on('notification:new', handleNotification);

      return () => {
        socket.emit('leave:channel', { channelId });
        socket.off('message:new', handleNewMessage);
        socket.off('message:reaction', handleReaction);
        socket.off('notification:new', handleNotification);
      };
    }
  }, [socket, channelId, queryClient]);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    if (location.hash?.startsWith('#message-')) {
      const el = document.querySelector(location.hash);
      if (el) (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, location.hash]);

  const handleReactionClick = (messageId: string, _channelIdForMessage: string, emoji: string) => {
    addReaction.mutate({ messageId, emoji });
    setReactionPickerMessageId(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading messages…</div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message._id} id={`message-${message._id}`} className="flex gap-3 group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                {message.user?.avatar ? (
                  <img src={message.user.avatar} alt={message.user.username} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    {message.user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{message.user?.username || 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(message.createdAt), 'h:mm a')}</span>
                  {message.editedAt && <span className="text-xs text-muted-foreground">(edited)</span>}
                  <div className="flex-1" />
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setThreadRootId(message._id)}
                    >
                      <MessageCircle className="h-3.5 w-3 mr-1" />
                      Reply
                    </Button>
                    {currentWorkspace && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedMessageId(message._id); setCreateOpen(true); }}>
                        Create task
                      </Button>
                    )}
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setReactionPickerMessageId(reactionPickerMessageId === message._id ? null : message._id)}
                      >
                        Add reaction
                      </Button>
                      {reactionPickerMessageId === message._id && (
                        <div className="absolute left-0 top-full z-10 mt-1 flex gap-1 rounded-lg border border-border bg-popover p-1 shadow-md">
                          {REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="rounded p-1.5 text-lg hover:bg-muted"
                              onClick={() => handleReactionClick(message._id, message.channelId, emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-1 text-foreground/90">
                  <MessageContent content={message.content} mentions={message.mentions} />
                </p>
                {message.attachments?.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((fileId: string) => (
                      <FilePreview key={fileId} fileId={fileId} />
                    ))}
                  </div>
                )}
                {message.reactions?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.reactions.map((reaction, idx) => (
                      <button
                        key={`${reaction.emoji}-${idx}`}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs hover:bg-muted transition-colors"
                        onClick={() => handleReactionClick(message._id, message.channelId, reaction.emoji)}
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
        </div>
        <MessageInput channelId={channelId} />
      </div>

      {/* Thread panel */}
      {threadRootId && (
        <div className="flex w-96 flex-col border-l border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Thread</span>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setThreadRootId(null)} aria-label="Close thread">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {threadMessages.isLoading && <p className="text-sm text-muted-foreground">Loading thread…</p>}
            {threadMessages.data?.map((msg) => (
              <div key={msg._id} className={cn("flex gap-2", msg._id === threadRootId && "rounded-lg bg-muted/30 p-2")}>
                <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
                  {msg.user?.avatar ? (
                    <img src={msg.user.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">{msg.user?.username?.[0] || 'U'}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">{msg.user?.username || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(msg.createdAt), 'h:mm a')}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-foreground/90">
                    <MessageContent content={msg.content} mentions={msg.mentions} />
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-2">
            <MessageInput channelId={channelId} threadId={threadRootId} replyToId={threadRootId} />
          </div>
        </div>
      )}

      {currentWorkspace && selectedMessage && (
        <CreateTaskFromMessageDialog
          open={createOpen}
          onOpenChange={(open) => { setCreateOpen(open); if (!open) setSelectedMessageId(null); }}
          workspaceId={currentWorkspace._id}
          message={selectedMessage}
        />
      )}
    </div>
  );
}
