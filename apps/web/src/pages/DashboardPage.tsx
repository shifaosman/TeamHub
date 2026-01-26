import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces, useOrganizations } from '@/hooks/useWorkspaces';
import { useChannels } from '@/hooks/useChannels';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: workspaces, isLoading: workspacesLoading, error: workspacesError } = useWorkspaces();
  const { data: organizations, isLoading: orgsLoading, error: orgsError } = useOrganizations();
  const { currentWorkspace } = useWorkspaceStore();
  const { data: channels, error: channelsError } = useChannels(currentWorkspace?._id || '');
  
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Not authenticated. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {currentWorkspace ? currentWorkspace.name : 'Dashboard'}
          </h2>
          {currentWorkspace?.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{currentWorkspace.description}</p>
          )}
        </div>
      </header>

      <div className="p-6">
          {(workspacesError || orgsError || channelsError) && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                Error loading data: {workspacesError?.message || orgsError?.message || channelsError?.message}
              </p>
            </div>
          )}
          {workspacesLoading || orgsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">Organizations</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {organizations?.length || 0} organization(s)
                  </p>
                  <Link to="/organizations/new">
                    <Button>Create Organization</Button>
                  </Link>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-2">Workspaces</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {workspaces?.length || 0} workspace(s)
                  </p>
                  <Link to="/workspaces/new">
                    <Button>Create Workspace</Button>
                  </Link>
                </div>

                {currentWorkspace && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-gray-600 mb-4">Collaborative notes</p>
                    <Link to={`/workspaces/${currentWorkspace._id}/notes`}>
                      <Button>View Notes</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Channels */}
              {currentWorkspace && channels && channels.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
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
                        className="block px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700"
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
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Current Workspace</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Name:</span>
                      <span className="ml-2 text-sm text-gray-600">{currentWorkspace.name}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Slug:</span>
                      <span className="ml-2 text-sm text-gray-600">{currentWorkspace.slug}</span>
                    </div>
                    {currentWorkspace.description && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Description:</span>
                        <span className="ml-2 text-sm text-gray-600">
                          {currentWorkspace.description}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!workspaces || workspaces.length === 0) && (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <h3 className="text-lg font-semibold mb-2">Get Started</h3>
                  <p className="text-gray-600 mb-6">
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
      </div>
    </MainLayout>
  );
}
