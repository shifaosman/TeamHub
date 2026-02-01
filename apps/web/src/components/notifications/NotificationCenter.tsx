import { useNotifications, useMarkAsRead, useMarkAllAsRead, useUnreadCount } from '@/hooks/useNotifications';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { currentWorkspace } = useWorkspaceStore();
  const { data, isLoading } = useNotifications(currentWorkspace?._id);
  const { data: unreadCount } = useUnreadCount(currentWorkspace?._id);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  if (!isOpen) return null;

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead.mutateAsync(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync(currentWorkspace?._id);
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-card text-card-foreground border-l border-border shadow-xl z-50 flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        <div className="flex gap-2">
          {unreadCount && unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAllAsRead}>
              Mark all read
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading notifications...</div>
        ) : !data || data.notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="mb-2">No notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-muted/50 cursor-pointer ${
                  !notification.isRead ? 'bg-primary/10' : ''
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification._id);
                  }
                  if (notification.link) {
                    window.location.href = notification.link;
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    !notification.isRead ? 'bg-blue-500' : 'bg-transparent'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{notification.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
