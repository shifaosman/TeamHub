import { Link, useLocation } from 'react-router-dom';
import { useChannels } from '@/hooks/useChannels';

interface ChannelListProps {
  workspaceId: string;
}

export function ChannelList({ workspaceId }: ChannelListProps) {
  const { data: channels, isLoading } = useChannels(workspaceId);
  const location = useLocation();
  const currentChannelId = location.pathname.split('/channels/')[1];

  if (isLoading) {
    return <div className="text-sm text-gray-500 p-4">Loading channels...</div>;
  }

  if (!channels || channels.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-2">No channels yet</p>
        <Link to={`/workspaces/${workspaceId}/channels/new`}>
          <Button size="sm" className="w-full">Create Channel</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {channels.map((channel) => (
        <Link
          key={channel._id}
          to={`/channels/${channel._id}`}
          className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            currentChannelId === channel._id
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <span className="mr-2">#</span>
          {channel.name}
        </Link>
      ))}
    </div>
  );
}
