import { Link, useLocation } from 'react-router-dom';
import { useChannels } from '@/hooks/useChannels';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChannelListProps {
  workspaceId: string;
}

export function ChannelList({ workspaceId }: ChannelListProps) {
  const { data: channels, isLoading } = useChannels(workspaceId);
  const location = useLocation();
  const currentChannelId = location.pathname.split('/channels/')[1];

  if (isLoading) {
    return (
      <div className="space-y-1">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3">
        <p className="mb-2 text-xs text-muted-foreground">No channels yet</p>
        <Link to={`/workspaces/${workspaceId}/channels/new`}>
          <Button size="sm" variant="outline" className="w-full rounded-lg">
            Create channel
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {channels.map((channel) => (
        <Link
          key={channel._id}
          to={`/channels/${channel._id}`}
          className={cn(
            'block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-150',
            currentChannelId === channel._id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-foreground hover:bg-muted'
          )}
        >
          <span className="mr-2 text-muted-foreground">#</span>
          {channel.name}
        </Link>
      ))}
    </div>
  );
}
