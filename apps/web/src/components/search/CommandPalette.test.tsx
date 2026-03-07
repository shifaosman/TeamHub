import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { CommandPalette } from './CommandPalette';

vi.mock('@/stores/workspaceStore', () => ({
  useWorkspaceStore: () => ({
    currentWorkspace: { _id: 'workspace-1', name: 'Test Workspace' },
  }),
}));

vi.mock('@/hooks/useSearch', () => ({
  useGlobalSearch: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<CommandPalette isOpen={false} onClose={() => {}} />);
    expect(screen.queryByPlaceholderText(/Search or run a command/i)).not.toBeInTheDocument();
  });

  it('renders search input and results when open', () => {
    render(<CommandPalette isOpen={true} onClose={() => {}} />);

    expect(screen.getByPlaceholderText(/Search or run a command/i)).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // With workspace set and empty query, page items (Dashboard, Notes, etc.) should be present
    expect(screen.getByRole('option', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Activity/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Notes/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Files/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Analytics/i })).toBeInTheDocument();
  });

  it('shows search results count in footer when results exist', () => {
    render(<CommandPalette isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/\d+ result/)).toBeInTheDocument();
  });
});
