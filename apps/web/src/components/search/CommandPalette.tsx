import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '@/hooks/useSearch';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import {
  Search,
  X,
  LayoutDashboard,
  Activity,
  BarChart3,
  StickyNote,
  FolderKanban,
  FolderOpen,
  MessageSquare,
  FileText,
  CheckSquare,
  Hash,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  parseCommand,
  getRecentActions,
  addRecentAction,
  type RecentEntry,
} from '@/lib/commandPalette';
import type { SearchResult } from '@/hooks/useSearch';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type FlatItem =
  | { kind: 'page'; id: string; label: string; path: string; icon: React.ReactNode }
  | { kind: 'command'; id: string; label: string; subtitle?: string; action: string; searchQuery?: string; icon: React.ReactNode }
  | { kind: 'recent'; id: string; entry: RecentEntry; icon: React.ReactNode }
  | { kind: 'channel'; id: string; label: string; channelId: string; icon: React.ReactNode }
  | { kind: 'project'; id: string; label: string; projectId: string; icon: React.ReactNode }
  | { kind: 'note'; id: string; label: string; noteId: string; icon: React.ReactNode }
  | { kind: 'task'; id: string; label: string; taskId: string; projectId: string; icon: React.ReactNode }
  | { kind: 'message'; id: string; label: string; channelId: string; icon: React.ReactNode }
  | { kind: 'file'; id: string; label: string; fileId: string; icon: React.ReactNode }
  | { kind: 'user'; id: string; label: string; userId: string; icon: React.ReactNode };

function buildFlatList(
  workspaceId: string,
  query: string,
  searchResults: SearchResult | undefined,
  recent: RecentEntry[]
): FlatItem[] {
  const parsed = parseCommand(query);
  const items: FlatItem[] = [];

  const empty = !query.trim();

  if (empty) {
    // Recent
    recent.slice(0, 4).forEach((entry) => {
      items.push({
        kind: 'recent',
        id: `recent-${entry.id}-${entry.timestamp}`,
        entry,
        icon: <Activity className="h-4 w-4" />,
      });
    });
    // Pages
    items.push({
      kind: 'page',
      id: 'page-dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    });
    items.push({
      kind: 'page',
      id: 'page-activity',
      label: 'Activity',
      path: `/workspaces/${workspaceId}/activity`,
      icon: <Activity className="h-4 w-4" />,
    });
    items.push({
      kind: 'page',
      id: 'page-analytics',
      label: 'Analytics',
      path: `/workspaces/${workspaceId}/analytics`,
      icon: <BarChart3 className="h-4 w-4" />,
    });
    items.push({
      kind: 'page',
      id: 'page-notes',
      label: 'Notes',
      path: `/workspaces/${workspaceId}/notes`,
      icon: <StickyNote className="h-4 w-4" />,
    });
    items.push({
      kind: 'page',
      id: 'page-files',
      label: 'Files',
      path: `/workspaces/${workspaceId}/files`,
      icon: <FolderOpen className="h-4 w-4" />,
    });
    items.push({
      kind: 'page',
      id: 'page-projects',
      label: 'Projects',
      path: '/projects',
      icon: <FolderKanban className="h-4 w-4" />,
    });
    // Suggested commands
    items.push({
      kind: 'command',
      id: 'cmd-create-note',
      label: 'Create note',
      subtitle: 'Start a new note',
      action: 'create-note',
      icon: <StickyNote className="h-4 w-4" />,
    });
    items.push({
      kind: 'command',
      id: 'cmd-create-task',
      label: 'Create task',
      subtitle: 'Add a task to a project',
      action: 'create-task',
      icon: <CheckSquare className="h-4 w-4" />,
    });
  } else {
    // Action suggestion when parsed is action
    if (parsed.kind === 'action' && parsed.action) {
      if (parsed.action === 'go-analytics') {
        items.push({
          kind: 'page',
          id: 'page-analytics',
          label: 'Open Analytics',
          path: `/workspaces/${workspaceId}/analytics`,
          icon: <BarChart3 className="h-4 w-4" />,
        });
      } else if (parsed.action === 'go-activity') {
        items.push({
          kind: 'page',
          id: 'page-activity',
          label: 'Open Activity',
          path: `/workspaces/${workspaceId}/activity`,
          icon: <Activity className="h-4 w-4" />,
        });
      } else if (parsed.action === 'go-dashboard') {
        items.push({
          kind: 'page',
          id: 'page-dashboard',
          label: 'Go to Dashboard',
          path: '/dashboard',
          icon: <LayoutDashboard className="h-4 w-4" />,
        });
      } else if (parsed.action === 'create-note' && parsed.searchQuery) {
        items.push({
          kind: 'command',
          id: 'cmd-create-note',
          label: `Create note "${parsed.searchQuery.slice(0, 40)}${parsed.searchQuery.length > 40 ? '…' : ''}"`,
          action: 'create-note',
          searchQuery: parsed.searchQuery,
          icon: <StickyNote className="h-4 w-4" />,
        });
      } else if (parsed.action === 'create-task' && parsed.searchQuery) {
        items.push({
          kind: 'command',
          id: 'cmd-create-task',
          label: `Create task "${parsed.searchQuery.slice(0, 40)}${parsed.searchQuery.length > 40 ? '…' : ''}"`,
          action: 'create-task',
          searchQuery: parsed.searchQuery,
          icon: <CheckSquare className="h-4 w-4" />,
        });
      }
    }

    // Search results (use searchQuery for API, show all groups)
    const q = parsed.searchQuery || query.trim();
    if (searchResults && q.length > 0) {
      const projects = searchResults.projects ?? [];
      const channels = searchResults.channels ?? [];
      const notes = searchResults.notes ?? [];
      const tasks = searchResults.tasks ?? [];
      const messages = searchResults.messages ?? [];
      const files = searchResults.files ?? [];
      const users = searchResults.users ?? [];

      const filter = parsed.searchKey;
      if (!filter || filter === 'projects') {
        projects.forEach((p) => {
          items.push({
            kind: 'project',
            id: `project-${p._id}`,
            label: p.name,
            projectId: p._id,
            icon: <FolderKanban className="h-4 w-4" />,
          });
        });
      }
      if (!filter || filter === 'channels') {
        channels.forEach((c) => {
          items.push({
            kind: 'channel',
            id: `channel-${c._id}`,
            label: c.name,
            channelId: c._id,
            icon: <Hash className="h-4 w-4" />,
          });
        });
      }
      if (!filter || filter === 'notes') {
        notes.forEach((n) => {
          items.push({
            kind: 'note',
            id: `note-${n._id}`,
            label: n.title,
            noteId: n._id,
            icon: <StickyNote className="h-4 w-4" />,
          });
        });
      }
      if (!filter || filter === 'tasks') {
        tasks.forEach((t) => {
          items.push({
            kind: 'task',
            id: `task-${t._id}`,
            label: t.title,
            taskId: t._id,
            projectId: t.projectId,
            icon: <CheckSquare className="h-4 w-4" />,
          });
        });
      }
      if (!filter || filter === 'messages') {
        messages.forEach((m) => {
          items.push({
            kind: 'message',
            id: `message-${m._id}`,
            label: m.content?.slice(0, 50) || 'Message',
            channelId: m.channelId,
            icon: <MessageSquare className="h-4 w-4" />,
          });
        });
      }
      if (!filter || filter === 'files') {
        files.forEach((f) => {
          items.push({
            kind: 'file',
            id: `file-${f._id}`,
            label: f.originalName,
            fileId: f._id,
            icon: <FileText className="h-4 w-4" />,
          });
        });
      }
      if (!filter) {
        users.forEach((u) => {
          items.push({
            kind: 'user',
            id: `user-${u._id}`,
            label: u.username,
            userId: u._id,
            icon: <User className="h-4 w-4" />,
          });
        });
      }
    }
  }

  return items;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const workspaceId = currentWorkspace?._id ?? '';
  const searchQuery = query.trim() ? (parseCommand(query).searchQuery || query.trim()) : '';
  const { data: searchResults, isLoading } = useGlobalSearch(workspaceId, searchQuery, 25);

  const flatItems = buildFlatList(workspaceId, query, searchResults, recent);

  useEffect(() => {
    setRecent(getRecentActions());
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const execute = useCallback(
    (item: FlatItem) => {
      if (item.kind === 'page') {
        addRecentAction({ id: item.id, type: 'page', label: item.label, path: item.path });
        navigate(item.path);
        onClose();
        return;
      }
      if (item.kind === 'recent') {
        if (item.entry.path) {
          navigate(item.entry.path);
          onClose();
        }
        return;
      }
      if (item.kind === 'channel') {
        addRecentAction({
          id: item.id,
          type: 'channel',
          label: item.label,
          path: `/channels/${item.channelId}`,
        });
        navigate(`/channels/${item.channelId}`);
        onClose();
        return;
      }
      if (item.kind === 'project') {
        addRecentAction({
          id: item.id,
          type: 'project',
          label: item.label,
          path: `/projects/${item.projectId}`,
        });
        navigate(`/projects/${item.projectId}`);
        onClose();
        return;
      }
      if (item.kind === 'note') {
        addRecentAction({
          id: item.id,
          type: 'note',
          label: item.label,
          path: `/notes/${item.noteId}`,
        });
        navigate(`/notes/${item.noteId}`);
        onClose();
        return;
      }
      if (item.kind === 'task') {
        addRecentAction({
          id: item.id,
          type: 'task',
          label: item.label,
          path: `/projects/${item.projectId}?taskId=${item.taskId}`,
        });
        navigate(`/projects/${item.projectId}?taskId=${item.taskId}`);
        onClose();
        return;
      }
      if (item.kind === 'message') {
        navigate(`/channels/${item.channelId}`);
        onClose();
        return;
      }
      if (item.kind === 'file') {
        onClose();
        return;
      }
      if (item.kind === 'user') {
        onClose();
        return;
      }
      if (item.kind === 'command') {
        if (item.action === 'create-note') {
          addRecentAction({
            id: item.id,
            type: 'command',
            label: item.label,
            action: item.action,
          });
          const path = workspaceId
            ? `/workspaces/${workspaceId}/notes/new`
            : '/dashboard';
          navigate(path, { state: item.searchQuery ? { title: item.searchQuery } : undefined });
          onClose();
          return;
        }
        if (item.action === 'create-task') {
          addRecentAction({
            id: item.id,
            type: 'command',
            label: item.label,
            action: item.action,
          });
          navigate('/projects', { state: item.searchQuery ? { newTaskTitle: item.searchQuery } : undefined });
          onClose();
          return;
        }
      }
    },
    [navigate, onClose, workspaceId]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i < flatItems.length - 1 ? i + 1 : i));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i > 0 ? i - 1 : 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatItems[selectedIndex];
        if (item) execute(item);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, flatItems, execute, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, searchResults]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const child = el.children[selectedIndex] as HTMLElement;
    if (child) child.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /mac|darwin/i.test(navigator.platform);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[12vh] backdrop-blur-md animate-in fade-in duration-150">
      <div
        ref={containerRef}
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl animate-in zoom-in-95 slide-in-from-top-4 duration-200"
      >
        <div className="flex items-center gap-3 border-b border-border/80 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or run a command…"
            className="flex-1 bg-transparent py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Command palette search"
          />
          <kbd className="hidden rounded-md border border-border bg-muted/80 px-2 py-1 text-xs text-muted-foreground sm:inline-block">
            Esc
          </kbd>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={listRef} className="max-h-[min(60vh,400px)] overflow-y-auto py-2">
          {!workspaceId && query.trim() ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Select a workspace to search.
            </div>
          ) : isLoading && searchQuery ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Searching…
            </div>
          ) : flatItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground">No results</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Try: <kbd className="rounded border border-border bg-muted/50 px-1.5 py-0.5">task Fix bug</kbd>
                {' · '}
                <kbd className="rounded border border-border bg-muted/50 px-1.5 py-0.5">note Meeting</kbd>
                {' · '}
                <kbd className="rounded border border-border bg-muted/50 px-1.5 py-0.5">analytics</kbd>
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5" role="listbox">
              {flatItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                const label =
                  item.kind === 'recent' ? item.entry.label : item.label;
                const subtitle =
                  item.kind === 'recent'
                    ? item.entry.path
                    : 'subtitle' in item
                      ? item.subtitle
                      : undefined;
                return (
                  <li key={item.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => execute(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        isSelected
                          ? 'bg-primary/10 text-foreground'
                          : 'text-foreground hover:bg-muted/60'
                      )}
                    >
                      <span className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{label}</div>
                        {subtitle && (
                          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/80 px-4 py-2 text-xs text-muted-foreground">
          <span>
            {flatItems.length > 0 ? `${flatItems.length} result${flatItems.length !== 1 ? 's' : ''}` : 'Commands: task, note, project, channel, analytics'}
          </span>
          <span className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <kbd className="rounded border border-border bg-muted/50 px-1.5 py-0.5">
              {isMac ? '⌘' : 'Ctrl+'}K
            </kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
