/**
 * Command palette: parser, item types, and suggested commands.
 * Supports prefix-based commands (e.g. "task Fix bug", "note Sprint plan", "analytics").
 */

export type PaletteItemType =
  | 'page'
  | 'command'
  | 'channel'
  | 'project'
  | 'note'
  | 'task'
  | 'message'
  | 'file'
  | 'user';

export interface BasePaletteItem {
  id: string;
  type: PaletteItemType;
  label: string;
  subtitle?: string;
  keywords?: string[];
}

export interface PagePaletteItem extends BasePaletteItem {
  type: 'page';
  path: string;
}

export interface CommandPaletteItem extends BasePaletteItem {
  type: 'command';
  action: string;
  payload?: Record<string, unknown>;
}

export interface EntityPaletteItem extends BasePaletteItem {
  type: 'channel' | 'project' | 'note' | 'task' | 'message' | 'file' | 'user';
  path?: string;
  entityId?: string;
  projectId?: string;
  channelId?: string;
}

export type PaletteItem = PagePaletteItem | CommandPaletteItem | EntityPaletteItem;

/** Prefixes that trigger command/action mode. Order matters for parsing. */
const PREFIXES: { prefix: string; aliases: string[]; action: string; searchKey: string }[] = [
  { prefix: 'task', aliases: ['t', 'tasks'], action: 'create-task', searchKey: 'tasks' },
  { prefix: 'note', aliases: ['n', 'notes'], action: 'create-note', searchKey: 'notes' },
  { prefix: 'project', aliases: ['p', 'proj'], action: 'open-project', searchKey: 'projects' },
  { prefix: 'channel', aliases: ['c', 'ch'], action: 'open-channel', searchKey: 'channels' },
  { prefix: 'assign', aliases: [], action: 'assign-task', searchKey: 'tasks' },
  { prefix: 'search files', aliases: ['files', 'file'], action: 'search-files', searchKey: 'files' },
  { prefix: 'search notes', aliases: ['notes search'], action: 'search-notes', searchKey: 'notes' },
];

const PAGE_ACTIONS = ['analytics', 'activity', 'dashboard', 'go dashboard', 'go activity', 'go analytics'];

export interface ParsedCommand {
  kind: 'search' | 'action';
  action?: string;
  searchQuery: string;
  searchKey?: string; // filter to this category
}

/**
 * Parse user input into either a search query or an action + remainder.
 */
export function parseCommand(input: string): ParsedCommand {
  const raw = input.trim();
  const lower = raw.toLowerCase();

  if (!raw) {
    return { kind: 'search', searchQuery: '' };
  }

  // Exact page shortcuts
  for (const page of PAGE_ACTIONS) {
    if (lower === page || lower === `go to ${page}` || lower === `open ${page}`) {
      if (page.includes('dashboard')) return { kind: 'action', action: 'go-dashboard', searchQuery: '' };
      if (page.includes('activity')) return { kind: 'action', action: 'go-activity', searchQuery: '' };
      if (page.includes('analytics')) return { kind: 'action', action: 'go-analytics', searchQuery: '' };
    }
  }
  if (lower === 'analytics') return { kind: 'action', action: 'go-analytics', searchQuery: '' };
  if (lower === 'activity') return { kind: 'action', action: 'go-activity', searchQuery: '' };
  if (lower === 'dashboard') return { kind: 'action', action: 'go-dashboard', searchQuery: '' };

  // Prefix-based: "task Fix bug" -> action create-task, searchQuery "Fix bug"
  for (const { prefix, aliases, action, searchKey } of PREFIXES) {
    if (lower.startsWith(prefix + ' ')) {
      return { kind: 'action', action, searchQuery: raw.slice(prefix.length).trim(), searchKey };
    }
    for (const a of aliases) {
      if (a.length > 0 && lower.startsWith(a + ' ')) {
        return { kind: 'action', action, searchQuery: raw.slice(a.length).trim(), searchKey };
      }
    }
  }

  // "assign X to Y" simple pattern
  const assignMatch = lower.match(/^assign\s+(.+?)\s+to\s+(.+)$/);
  if (assignMatch) {
    return {
      kind: 'action',
      action: 'assign-task',
      searchQuery: raw,
      searchKey: 'tasks',
    };
  }

  return { kind: 'search', searchQuery: raw };
}

const RECENT_KEY = 'teamhub-command-palette-recent';
const MAX_RECENT = 8;

export interface RecentEntry {
  id: string;
  type: PaletteItemType;
  label: string;
  path?: string;
  action?: string;
  timestamp: number;
}

export function getRecentActions(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function addRecentAction(entry: Omit<RecentEntry, 'timestamp'>): void {
  try {
    const list = getRecentActions();
    const newEntry: RecentEntry = { ...entry, timestamp: Date.now() };
    const filtered = list.filter((e) => e.id !== entry.id || e.path !== entry.path);
    const updated = [newEntry, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
