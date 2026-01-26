import { useParams } from 'react-router-dom';
import { MessageList } from '@/components/messages/MessageList';
import { MessageInput } from '@/components/messages/MessageInput';
import { useChannels } from '@/hooks/useChannels';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';

export function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const { data: channels } = useChannels(currentWorkspace?._id || '');
  
  // Enable real-time message notifications
  useMessageNotifications();

  const channel = channels?.find((c) => c._id === channelId);

  if (!channelId || !currentWorkspace) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Select a channel to start messaging</div>
        </div>
      </MainLayout>
    );
  }

  const channel = channels?.find((c) => c._id === channelId);

  return (
    <MainLayout>
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 px-6 py-4 sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">#{channel?.name || 'Channel'}</h2>
          {channel?.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{channel.description}</p>
          )}
        </div>
      </header>
      <div className="flex-1 flex flex-col overflow-hidden">
        <MessageList channelId={channelId} />
        <MessageInput channelId={channelId} />
      </div>
    </MainLayout>
  );
}
