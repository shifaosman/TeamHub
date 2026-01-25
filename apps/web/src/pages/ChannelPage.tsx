import { useParams, Link } from 'react-router-dom';
import { MessageList } from '@/components/messages/MessageList';
import { MessageInput } from '@/components/messages/MessageInput';
import { useChannels } from '@/hooks/useChannels';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const { user, logout } = useAuth();
  const { data: channels } = useChannels(currentWorkspace?._id || '');

  const channel = channels?.find((c) => c._id === channelId);

  if (!channelId || !currentWorkspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">TeamHub</h1>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
        </aside>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Select a channel to start messaging</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">TeamHub</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 mb-4 block">
            ← Back to Dashboard
          </Link>
          {channels && channels.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Channels
              </h3>
              <div className="space-y-1">
                {channels.map((c) => (
                  <Link
                    key={c._id}
                    to={`/channels/${c._id}`}
                    className={`block px-3 py-2 rounded-md text-sm ${
                      channelId === c._id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="mr-2">#</span>
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2">{user?.username}</div>
          <Button onClick={logout} variant="outline" className="w-full">
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">#{channel?.name || 'Channel'}</h2>
            {channel?.description && (
              <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
            )}
          </div>
          <NotificationBell />
        </header>
        <div className="flex-1 flex flex-col overflow-hidden">
          <MessageList channelId={channelId} />
          <MessageInput channelId={channelId} />
        </div>
      </main>
    </div>
  );
}
