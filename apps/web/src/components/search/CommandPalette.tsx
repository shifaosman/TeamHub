import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '@/hooks/useSearch';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading } = useGlobalSearch(
    currentWorkspace?._id || '',
    query,
    20
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery(''); // Reset query when opening
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const maxIndex = getTotalResults() - 1;
          return prev < maxIndex ? prev + 1 : prev;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(selectedIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, searchResults]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const getTotalResults = (): number => {
    if (!searchResults) return 0;
    return (
      (searchResults.messages?.length || 0) +
      (searchResults.channels?.length || 0) +
      (searchResults.users?.length || 0)
    );
  };

  const handleSelect = (index: number) => {
    if (!searchResults) return;

    let currentIndex = 0;

    // Check messages
    if (searchResults.messages && searchResults.messages.length > 0) {
      if (index < searchResults.messages.length) {
        const message = searchResults.messages[index];
        navigate(`/channels/${message.channelId}`);
        onClose();
        return;
      }
      currentIndex += searchResults.messages.length;
    }

    // Check channels
    if (searchResults.channels && searchResults.channels.length > 0) {
      if (index < currentIndex + searchResults.channels.length) {
        const channel = searchResults.channels[index - currentIndex];
        navigate(`/channels/${channel._id}`);
        onClose();
        return;
      }
      currentIndex += searchResults.channels.length;
    }

    // Check users
    if (searchResults.users && searchResults.users.length > 0) {
      if (index < currentIndex + searchResults.users.length) {
        // Navigate to user profile or DM (if implemented)
        onClose();
        return;
      }
    }
  };

  if (!isOpen) return null;

  const totalResults = getTotalResults();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black bg-opacity-50">
      <div ref={containerRef} className="w-full max-w-2xl bg-card text-card-foreground rounded-lg shadow-xl border border-border">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages, channels, users..."
            className="flex-1 px-4 py-2 text-lg border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div ref={resultsRef} className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : !query || query.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p className="mb-2">Start typing to search</p>
              <p className="text-sm">Search for messages, channels, or users</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <>
              {/* Messages */}
              {searchResults?.messages && searchResults.messages.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase bg-muted">
                    Messages ({searchResults.messages.length})
                  </div>
                  {searchResults.messages.map((message, idx) => {
                    const globalIndex = idx;
                    return (
                      <button
                        key={message._id}
                        onClick={() => handleSelect(globalIndex)}
                        className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors ${
                          selectedIndex === globalIndex ? 'bg-primary/10 border-l-4 border-primary' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {message.user?.avatar ? (
                              <img
                                src={message.user.avatar}
                                alt={message.user.username}
                                className="w-full h-full rounded-full"
                              />
                            ) : (
                              <span className="text-xs font-medium text-muted-foreground">
                                {message.user?.username?.[0]?.toUpperCase() || 'U'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {message.user?.username || 'Unknown'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/80 mt-1 line-clamp-2">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Channels */}
              {searchResults?.channels && searchResults.channels.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase bg-muted">
                    Channels ({searchResults.channels.length})
                  </div>
                  {searchResults.channels.map((channel, idx) => {
                    const globalIndex =
                      (searchResults.messages?.length || 0) + idx;
                    return (
                      <button
                        key={channel._id}
                        onClick={() => handleSelect(globalIndex)}
                        className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors ${
                          selectedIndex === globalIndex
                            ? 'bg-primary/10 border-l-4 border-primary'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-xl">#</div>
                          <div>
                            <div className="font-semibold text-foreground">{channel.name}</div>
                            {channel.description && (
                              <div className="text-sm text-muted-foreground mt-1">{channel.description}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Users */}
              {searchResults?.users && searchResults.users.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase bg-muted">
                    Users ({searchResults.users.length})
                  </div>
                  {searchResults.users.map((user, idx) => {
                    const globalIndex =
                      (searchResults.messages?.length || 0) +
                      (searchResults.channels?.length || 0) +
                      idx;
                    return (
                      <button
                        key={user._id}
                        onClick={() => handleSelect(globalIndex)}
                        className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors ${
                          selectedIndex === globalIndex
                            ? 'bg-primary/10 border-l-4 border-primary'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.username}
                                className="w-full h-full rounded-full"
                              />
                            ) : (
                              <span className="text-sm font-medium text-muted-foreground">
                                {user.username?.[0]?.toUpperCase() || 'U'}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{user.username}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>
              {totalResults > 0 ? `${totalResults} result${totalResults !== 1 ? 's' : ''}` : 'No results'}
            </span>
            <span>↑↓ Navigate • Enter Select • Click outside or X to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
