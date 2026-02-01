import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces, useOrganizations } from '@/hooks/useWorkspaces';
import { useChannels } from '@/hooks/useChannels';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';
import { InviteMembersDialog } from '@/components/workspace/InviteMembersDialog';
import { useState } from 'react';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: workspaces, isLoading: workspacesLoading, error: workspacesError } = useWorkspaces();
  const { data: organizations, isLoading: orgsLoading, error: orgsError } = useOrganizations();
  const { currentWorkspace } = useWorkspaceStore();
  const { data: channels, error: channelsError } = useChannels(currentWorkspace?._id || '');
  const [inviteOpen, setInviteOpen] = useState(false);
  
  // Enable real-time message notifications
  useMessageNotifications();

  // Debug logging (remove in production)
  if (import.meta.env.DEV) {
    console.log('DashboardPage render:', {
      user,
      workspaces,
      organizations,
      currentWorkspace,
      channels,
      workspacesLoading,
      orgsLoading,
      workspacesError,
      orgsError,
      channelsError,
    });
  }

  return (
    <MainLayout>
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-10">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {currentWorkspace ? currentWorkspace.name : 'Dashboard'}
          </h2>
          {currentWorkspace?.description && (
            <p className="text-sm text-muted-foreground mt-1">{currentWorkspace.description}</p>
          )}
        </div>
      </header>

      <div className="p-6">
          {(workspacesError || orgsError || channelsError) && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-destructive text-sm">
                Error loading data: {workspacesError?.message || orgsError?.message || channelsError?.message}
              </p>
            </div>
          )}
          {workspacesLoading || orgsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-2">Organizations</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {organizations?.length || 0} organization(s)
                  </p>
                  <Link to="/organizations/new">
                    <Button>Create Organization</Button>
                  </Link>
                </div>

                <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-2">Workspaces</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {workspaces?.length || 0} workspace(s)
                  </p>
                  <Link to="/workspaces/new">
                    <Button>Create Workspace</Button>
                  </Link>
                </div>

                {currentWorkspace && (
                  <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground mb-4">Collaborative notes</p>
                    <Link to={`/workspaces/${currentWorkspace._id}/notes`}>
                      <Button>View Notes</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Channels */}
              {currentWorkspace && channels && channels.length > 0 && (
                <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Channels</h3>
                    <Link to={`/workspaces/${currentWorkspace._id}/channels/new`}>
                      <Button size="sm">+ New Channel</Button>
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {channels.map((channel) => (
                      <Link
                        key={channel._id}
                        to={`/channels/${channel._id}`}
                        className="block px-3 py-2 rounded-md hover:bg-muted text-foreground"
                      >
                        <span className="mr-2">#</span>
                        {channel.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Workspace Info */}
              {currentWorkspace && (
                <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Current Workspace</h3>
                    <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
                      Invite
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-foreground">Name:</span>
                      <span className="ml-2 text-sm text-muted-foreground">{currentWorkspace.name}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">Slug:</span>
                      <span className="ml-2 text-sm text-muted-foreground">{currentWorkspace.slug}</span>
                    </div>
                    {currentWorkspace.description && (
                      <div>
                        <span className="text-sm font-medium text-foreground">Description:</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {currentWorkspace.description}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentWorkspace && (
                <InviteMembersDialog
                  workspaceId={currentWorkspace._id}
                  open={inviteOpen}
                  onOpenChange={setInviteOpen}
                />
              )}

              {/* Empty State */}
              {(!workspaces || workspaces.length === 0) && (
                <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm p-12 text-center">
                  <h3 className="text-lg font-semibold mb-2">Get Started</h3>
                  <p className="text-muted-foreground mb-6">
                    Create an organization and workspace to start collaborating
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Link to="/organizations/new">
                      <Button>Create Organization</Button>
                    </Link>
                    {organizations && organizations.length > 0 && (
                      <Link to="/workspaces/new">
                        <Button variant="outline">Create Workspace</Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
    </MainLayout>
  );
}
