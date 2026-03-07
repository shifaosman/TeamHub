import { useState, useEffect } from 'react';
import { useActivity } from '@/hooks/useActivity';
import type { ActivityEntityType, ActivityItem } from '@/lib/activityApi';
import { ActivityItemRow } from './ActivityItemRow';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

const PAGE_SIZE = 20;
const FILTER_OPTIONS: { value: ActivityEntityType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'task', label: 'Tasks' },
  { value: 'project', label: 'Projects' },
  { value: 'note', label: 'Notes' },
  { value: 'message', label: 'Messages' },
  { value: 'file', label: 'Files' },
  { value: 'channel', label: 'Channels' },
  { value: 'workspace', label: 'Workspace' },
];

function groupByDay(items: ActivityItem[]): { label: string; items: ActivityItem[] }[] {
  const groups: { label: string; items: ActivityItem[] }[] = [];
  let currentLabel = '';
  let currentItems: ActivityItem[] = [];

  const getLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return 'Earlier this week';
    if (diffDays < 30) return 'Earlier this month';
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  for (const item of items) {
    const label = getLabel(item.createdAt);
    if (label !== currentLabel) {
      if (currentItems.length > 0) {
        groups.push({ label: currentLabel, items: currentItems });
      }
      currentLabel = label;
      currentItems = [item];
    } else {
      currentItems.push(item);
    }
  }
  if (currentItems.length > 0) {
    groups.push({ label: currentLabel, items: currentItems });
  }
  return groups;
}

interface ActivityTimelineProps {
  workspaceId: string;
}

export function ActivityTimeline({ workspaceId }: ActivityTimelineProps) {
  const [entityFilter, setEntityFilter] = useState<ActivityEntityType | 'all'>('all');
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<ActivityItem[]>([]);

  const { data: pageItems = [], isLoading, isFetching } = useActivity({
    workspaceId,
    limit: PAGE_SIZE,
    offset,
    entityType: entityFilter === 'all' ? undefined : entityFilter,
  });

  useEffect(() => {
    if (offset === 0) {
      setAccumulated(pageItems);
    } else {
      setAccumulated((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        const newItems = pageItems.filter((i) => !seen.has(i._id));
        return newItems.length ? [...prev, ...newItems] : prev;
      });
    }
  }, [offset, pageItems]);

  useEffect(() => {
    setAccumulated([]);
  }, [entityFilter]);

  const items = accumulated;
  const showLoadMore = pageItems.length >= PAGE_SIZE && !isLoading;
  const grouped = groupByDay(items);

  return (
    <div className="space-y-6">
      {/* Filter pills */}
      <div className="sticky top-0 z-10 flex flex-wrap gap-2 border-b border-border/60 bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setEntityFilter(opt.value as ActivityEntityType | 'all');
              setOffset(0);
            }}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              entityFilter === opt.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-border/60 bg-card/50 px-4 py-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-16 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">No activity yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              When your team creates projects, tasks, notes, or posts messages, they’ll show up here.
            </p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <ActivityItemRow
                    key={item._id}
                    item={item}
                    workspaceId={workspaceId}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showLoadMore && (
        <div className="flex justify-center pb-4">
          <button
            type="button"
            disabled={isFetching}
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
            className="rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {isFetching ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
