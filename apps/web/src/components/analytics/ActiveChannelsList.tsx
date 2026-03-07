import { Link } from 'react-router-dom';
import type { ChannelActivity } from '@/lib/analyticsApi';
import { cn } from '@/lib/utils';
interface ActiveChannelsListProps {
  channels: ChannelActivity[];
  className?: string;
}

export function ActiveChannelsList({ channels, className }: ActiveChannelsListProps) {
  if (channels.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border/60 bg-muted/20 px-4 py-8 text-center', className)}>
        <p className="text-sm text-muted-foreground">No channel activity in this period</p>
      </div>
    );
  }

  const max = Math.max(1, ...channels.map((c) => c.messageCount));

  return (
    <div className={cn('space-y-2', className)}>
      {channels.map((c, i) => (
        <Link
          key={c.channelId}
          to={`/channels/${c.channelId}`}
          className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/30"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{c.channelName}</p>
            <p className="text-xs text-muted-foreground">{c.messageCount} messages</p>
          </div>
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${(c.messageCount / max) * 100}%` }}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
