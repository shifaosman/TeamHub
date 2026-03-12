import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  MessageSquare,
  AtSign,
  CheckSquare,
  FileText,
  UserPlus,
  StickyNote,
  MessageCircle,
  LucideIcon,
} from 'lucide-react';
import { NotificationType } from '@teamhub/shared';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useUnreadCount, type Notification } from '@/hooks/useNotifications';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<string, LucideIcon> = {
  [NotificationType.MESSAGE]: MessageSquare,
  [NotificationType.MENTION]: AtSign,
  [NotificationType.REPLY]: MessageCircle,
  [NotificationType.CHANNEL_INVITE]: MessageCircle,
  [NotificationType.WORKSPACE_INVITE]: UserPlus,
  [NotificationType.FILE_SHARED]: FileText,
  [NotificationType.FILE_COMMENT]: FileText,
  [NotificationType.TASK_ASSIGNED]: CheckSquare,
  [NotificationType.TASK_CREATED]: CheckSquare,
  [NotificationType.TASK_UPDATED]: CheckSquare,
  [NotificationType.TASK_DUE_SOON]: CheckSquare,
  [NotificationType.NOTE_UPDATED]: StickyNote,
};

function getIcon(type: string): LucideIcon {
  return TYPE_ICONS[type] ?? Bell;
}

function getEntityName(notification: Notification): string | null {
  const m = notification.metadata;
  if (!m) return null;
  if (typeof m.originalName === 'string') return m.originalName;
  if (typeof m.title === 'string') return m.title;
  return null;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();
  const workspaceId = currentWorkspace?._id;
  const { data, isLoading } = useNotifications(workspaceId);
  const { data: unreadCount } = useUnreadCount(workspaceId);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead.mutateAsync(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync(workspaceId ?? undefined);
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) await handleMarkAsRead(n._id);
    if (n.link) {
      onClose();
      navigate(n.link);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col max-h-[min(24rem,80vh)]">
      <div className="shrink-0 p-3 border-b border-border flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        <div className="flex items-center gap-1">
          {unreadCount != null && unreadCount > 0 && (
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-foreground" onClick={handleMarkAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full max-w-[200px]" />
                  <Skeleton className="h-3 w-full max-w-[160px]" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : !data || data.notifications.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No notifications</p>
            <p className="text-xs text-muted-foreground mt-1">You're all caught up.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              const entityName = getEntityName(notification);
              const date = notification.createdAt
                ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                : '';
              return (
                <li key={notification._id}>
                  <button
                    type="button"
                    className={cn(
                      'w-full text-left flex items-start gap-3 p-3 transition-colors hover:bg-muted/60',
                      !notification.isRead && 'bg-primary/5'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        !notification.isRead ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                      {entityName && (
                        <p className="text-xs text-muted-foreground/80 mt-1 truncate">
                          {entityName}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1.5">{date}</p>
                    </div>
                    {!notification.isRead && (
                      <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
