import { useState } from 'react';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { NotificationCenter } from './NotificationCenter';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { currentWorkspace } = useWorkspaceStore();
  const { data: unreadCount } = useUnreadCount(currentWorkspace?._id);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-lg"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount != null && unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground',
                unreadCount > 99 ? 'px-1' : 'px-1.5'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="p-0 w-[22rem] max-h-[min(24rem,80vh)] flex flex-col">
        <NotificationCenter isOpen={true} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
