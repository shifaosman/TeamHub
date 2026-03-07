import type { UserActivity } from '@/lib/analyticsApi';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface ActiveUsersListProps {
  users: UserActivity[];
  className?: string;
}

export function ActiveUsersList({ users, className }: ActiveUsersListProps) {
  if (users.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border/60 bg-muted/20 px-4 py-8 text-center', className)}>
        <p className="text-sm text-muted-foreground">No user activity in this period</p>
      </div>
    );
  }

  const max = Math.max(1, ...users.map((u) => u.activityCount));

  return (
    <div className={cn('space-y-2', className)}>
      {users.map((u, i) => (
        <div
          key={u.userId}
          className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5 transition-colors hover:border-border"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
            {i + 1}
          </span>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {u.username ?? `User`}
            </p>
            <p className="text-xs text-muted-foreground">{u.activityCount} actions</p>
          </div>
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${(u.activityCount / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
