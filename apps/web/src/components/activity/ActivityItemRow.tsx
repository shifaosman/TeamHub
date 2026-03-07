import { Link } from 'react-router-dom';
import type { ActivityItem } from '@/lib/activityApi';
import { getActivityAction, getEntityTypeLabel, getActivityEntityName } from '@/lib/activityLabels';
import { cn } from '@/lib/utils';

const ENTITY_BADGE_VARIANTS: Record<string, string> = {
  project: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  task: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  note: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  message: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
  file: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  workspace: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  channel: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
};

function formatTime(createdAt: string): string {
  const d = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function getLink(item: ActivityItem): { to: string; label: string } | null {
  const name = getActivityEntityName(item);
  const entityType = item.entityType;
  const entityId = item.entityId ?? item.taskId ?? item.projectId;
  if (!entityId) return { to: '#', label: name };

  switch (entityType) {
    case 'project':
      return { to: `/projects/${entityId}`, label: name };
    case 'task':
      return { to: `/projects/${item.projectId ?? ''}?taskId=${entityId}`, label: name };
    case 'note':
      return { to: `/notes/${entityId}`, label: name };
    case 'channel':
      return { to: `/channels/${entityId}`, label: name };
    case 'message':
      return { to: `/channels/${item.metadata?.channelId ?? ''}`, label: name || 'message' };
    case 'file':
      return { to: '#', label: name };
    default:
      return { to: '#', label: name };
  }
}

interface ActivityItemRowProps {
  item: ActivityItem;
  workspaceId: string; // passed for consistent API; used for future deep-links if needed
}

export function ActivityItemRow({ item }: ActivityItemRowProps) {
  const actor = item.actor;
  const displayName =
    actor?.firstName || actor?.lastName
      ? [actor.firstName, actor.lastName].filter(Boolean).join(' ')
      : actor?.username ?? 'Someone';
  const action = getActivityAction(item.type);
  const entityName = getActivityEntityName(item);
  const link = getLink(item);
  const badgeClass = item.entityType ? ENTITY_BADGE_VARIANTS[item.entityType] : '';

  const isMoved = item.type === 'TASK_MOVED' && (item.metadata?.previousStatus != null) && (item.metadata?.status != null);
  const movedText = isMoved && item.metadata?.status != null
    ? ` to ${String(item.metadata?.status)}`
    : '';

  return (
    <div
      className={cn(
        'flex gap-4 rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:border-border hover:bg-card'
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted ring-1 ring-border/50">
        {actor?.avatar ? (
          <img src={actor.avatar} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            {(displayName || '?').slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          <span className="font-medium">{displayName}</span>
          <span className="text-muted-foreground"> {action} </span>
          {link && link.to !== '#' ? (
            <Link
              to={link.to}
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              {link.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{link?.label ?? entityName}</span>
          )}
          {movedText && (
            <span className="text-muted-foreground">{movedText}</span>
          )}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {item.entityType && (
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                badgeClass
              )}
            >
              {getEntityTypeLabel(item.entityType)}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{formatTime(item.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
