import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';
import { WorkspaceSelector } from '@/components/workspace/WorkspaceSelector';
import { ChannelList } from '@/components/channels/ChannelList';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useTheme } from '@/contexts/ThemeContext';
import { Home, Plus, LogOut, MessageSquare, Moon, Sun, FolderKanban, StickyNote, Search, Activity, BarChart3, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCommandPaletteContext } from '@/contexts/CommandPaletteContext';

const navLinkClass = (active: boolean) =>
  cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
    active
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  );

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspaceStore();
  const { theme, toggleTheme } = useTheme();
  const { open: openCommandPalette } = useCommandPaletteContext();
  const isMac = typeof navigator !== 'undefined' && navigator.platform?.toLowerCase().includes('mac');

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card/50">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold text-foreground">TeamHub</span>
        </Link>
      </div>

      {/* Nav + Workspace + Channels */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <Link to="/dashboard" data-testid="nav-dashboard" className={navLinkClass(location.pathname === '/dashboard')}>
          <Home className="h-4 w-4 shrink-0" />
          <span>Dashboard</span>
        </Link>

        <button
          type="button"
          onClick={openCommandPalette}
          className={navLinkClass(false)}
          title={`Search (${isMac ? '⌘' : 'Ctrl+'}K)`}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>Search</span>
          <kbd className="ml-auto rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {isMac ? '⌘' : 'Ctrl+'}K
          </kbd>
        </button>

        <WorkspaceSelector />

        {currentWorkspace && (
          <>
            <Link
              to="/projects"
              data-testid="nav-projects"
              className={navLinkClass(location.pathname.startsWith('/projects'))}
            >
              <FolderKanban className="h-4 w-4 shrink-0" />
              <span>Projects</span>
            </Link>

            <div className="pt-2">
              <div className="mb-1.5 flex items-center justify-between px-3">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Channels
                </span>
                <Link
                  to={`/workspaces/${currentWorkspace._id}/channels/new`}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="New channel"
                >
                  <Plus className="h-4 w-4" />
                </Link>
              </div>
              <ChannelList workspaceId={currentWorkspace._id} />
            </div>

            <Link
              to={`/workspaces/${currentWorkspace._id}/notes`}
              data-testid="nav-notes"
              className={navLinkClass(location.pathname.includes('/notes'))}
            >
              <StickyNote className="h-4 w-4 shrink-0" />
              <span>Notes</span>
            </Link>

            <Link
              to={`/workspaces/${currentWorkspace._id}/activity`}
              data-testid="nav-activity"
              className={navLinkClass(location.pathname.includes('/activity'))}
            >
              <Activity className="h-4 w-4 shrink-0" />
              <span>Activity</span>
            </Link>

            <Link
              to={`/workspaces/${currentWorkspace._id}/analytics`}
              data-testid="nav-analytics"
              className={navLinkClass(location.pathname.includes('/analytics'))}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>Analytics</span>
            </Link>

            <Link
              to={`/workspaces/${currentWorkspace._id}/files`}
              data-testid="nav-files"
              className={navLinkClass(location.pathname.includes('/files'))}
            >
              <FolderOpen className="h-4 w-4 shrink-0" />
              <span>Files</span>
            </Link>
          </>
        )}
      </nav>

      {/* User + theme + logout */}
      <div className="shrink-0 space-y-2 border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-border">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user?.username}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <NotificationBell />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="sm"
            className="flex-1 rounded-lg border-border shadow-sm transition-colors hover:bg-muted"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="flex-1 rounded-lg border-border shadow-sm transition-colors hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
