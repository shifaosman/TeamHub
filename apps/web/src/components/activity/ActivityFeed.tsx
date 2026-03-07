import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ActivityItem } from '@/lib/activityApi';
import { useWorkspaceMembers } from '@/hooks/useWorkspaces';

function labelForUser(members: any[] | undefined, userId: string) {
  if (!members) return userId;
  const found = members.find((m: any) => {
    const id = typeof m.userId === 'object' && m.userId?._id ? m.userId._id : m.userId;
    return id === userId;
  });
  if (!found) return userId;
  if (typeof found.userId === 'object' && found.userId) {
    return found.userId.username || found.userId.email || userId;
  }
  return userId;
}

function renderText(item: ActivityItem, members: any[] | undefined) {
  const actor = labelForUser(members, item.actorId);
  const md = item.metadata || {};

  switch (item.type) {
    case 'TASK_CREATED':
      return `${actor} created task "${md.title || 'task'}"`;
    case 'TASK_CREATED_FROM_MESSAGE':
      return `${actor} created task "${md.title || 'task'}" from a message`;
    case 'TASK_MOVED':
      return `${actor} moved "${md.title || 'task'}" to ${md.status || 'a new status'}`;
    case 'TASK_ASSIGNED': {
      const assigneeId = md.assigneeId != null ? String(md.assigneeId) : '';
      const assignee = assigneeId ? labelForUser(members, assigneeId) : 'someone';
      return `${actor} assigned "${md.title || 'task'}" to ${assignee}`;
    }
    case 'TASK_WATCHERS_UPDATED':
      return `${actor} updated watchers`;
    case 'TASK_DUE_UPDATED':
      return `${actor} updated due date`;
    case 'COMMENT_ADDED':
      return `${actor} added a comment`;
    case 'COMMENT_DELETED':
      return `${actor} deleted a comment`;
    case 'PROJECT_CREATED':
      return `${actor} created project "${md.name || 'project'}"`;
    case 'PROJECT_UPDATED':
      return `${actor} updated project "${md.name || 'project'}"`;
    case 'PROJECT_MEMBER_ADDED':
      return `${actor} added a project member`;
    case 'PROJECT_MEMBER_ROLE_UPDATED':
      return `${actor} updated a project member role`;
    case 'PROJECT_DELETED':
      return `${actor} deleted a project`;
    default:
      return `${actor} did ${item.type}`;
  }
}

interface ActivityFeedProps {
  workspaceId: string;
  items: ActivityItem[];
  isLoading?: boolean;
  error?: unknown;
}

export function ActivityFeed({ workspaceId, items, isLoading, error }: ActivityFeedProps) {
  const { data: members } = useWorkspaceMembers(workspaceId);

  const rows = useMemo(() => items || [], [items]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading activity…</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">Failed to load activity.</div>;
  }

  if (rows.length === 0) {
    return <div className="rounded-lg bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">No activity yet.</div>;
  }

  return (
    <div className="space-y-2">
      {rows.map((item) => (
        <div
          key={item._id}
          className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 transition-colors hover:border-border"
        >
          <div className="text-sm text-foreground">{renderText(item, members)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </div>
        </div>
      ))}
    </div>
  );
}

