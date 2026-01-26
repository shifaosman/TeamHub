import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useToast } from './useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function useMessageNotifications() {
  const socket = useSocket();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (message: any) => {
      // Don't show notification for own messages
      if (message.userId === user._id) return;

      // Show toast notification
      toast({
        title: `New message in #${message.channel?.name || 'channel'}`,
        description: message.user?.username
          ? `${message.user.username}: ${message.content?.substring(0, 100) || 'Sent a file'}`
          : 'New message',
        variant: 'default',
        duration: 5000,
      });
    };

    const handleMention = (message: any) => {
      // Don't show notification for own messages
      if (message.userId === user._id) return;

      // Show toast notification for mentions
      toast({
        title: `You were mentioned in #${message.channel?.name || 'channel'}`,
        description: `${message.user?.username || 'Someone'}: ${message.content?.substring(0, 100) || 'Mentioned you'}`,
        variant: 'warning',
        duration: 7000,
      });
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:mention', handleMention);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:mention', handleMention);
    };
  }, [socket, user, toast]);
}
