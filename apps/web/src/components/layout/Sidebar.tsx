import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';
import { WorkspaceSelector } from '@/components/workspace/WorkspaceSelector';
import { ChannelList } from '@/components/channels/ChannelList';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useTheme } from '@/contexts/ThemeContext';
import { Home, Plus, LogOut, MessageSquare, Moon, Sun } from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspaceStore();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">TeamHub</h1>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <Link
          to="/dashboard"
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            location.pathname === '/dashboard'
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-muted'
          }`}
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Link>

        <WorkspaceSelector />

        {currentWorkspace && (
          <div>
            <Link
              to="/projects"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname.startsWith('/projects')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <span>📋</span>
              Projects
            </Link>
          </div>
        )}

        {currentWorkspace && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Channels
              </h3>
              <Link to={`/workspaces/${currentWorkspace._id}/channels/new`}>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <ChannelList workspaceId={currentWorkspace._id} />
          </div>
        )}

        {currentWorkspace && (
          <div>
            <Link
              to={`/workspaces/${currentWorkspace._id}/notes`}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname.includes('/notes')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <span>📝</span>
              Notes
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full" />
              ) : (
                <span className="text-xs font-medium text-muted-foreground">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{user?.username}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <NotificationBell />
        </div>
        <div className="flex gap-2">
          <Button onClick={toggleTheme} variant="outline" size="sm" className="flex-1">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button onClick={logout} variant="outline" size="sm" className="flex-1">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
