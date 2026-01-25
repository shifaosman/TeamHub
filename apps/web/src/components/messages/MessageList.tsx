import { useEffect, useRef } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { format } from 'date-fns';
import { useSocket } from '@/hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { FilePreview } from '@/components/files/FilePreview';

interface MessageListProps {
  channelId: string;
}

export function MessageList({ channelId }: MessageListProps) {
  const { data: messages, isLoading } = useMessages(channelId);
  const socket = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (socket && channelId) {
      socket.emit('join:channel', { channelId });

      const handleNewMessage = (message: any) => {
        // Invalidate messages query to refetch
        queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      };

      const handleNotification = (notification: any) => {
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No messages yet</p>
          <p className="text-sm">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div key={message._id} className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            {message.user?.avatar ? (
              <img src={message.user.avatar} alt={message.user.username} className="w-full h-full rounded-full" />
            ) : (
              <span className="text-sm font-medium text-gray-600">
                {message.user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-gray-900">{message.user?.username || 'Unknown'}</span>
              <span className="text-xs text-gray-500">
                {format(new Date(message.createdAt), 'h:mm a')}
              </span>
              {message.editedAt && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>
            <p className="text-gray-700 mt-1 whitespace-pre-wrap break-words">{message.content}</p>
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
                    className="px-2 py-1 text-xs bg-gray-100 rounded-full hover:bg-gray-200"
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
  );
}
