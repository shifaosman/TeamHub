import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces, useOrganizations } from '@/hooks/useWorkspaces';
import { useChannels } from '@/hooks/useChannels';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/button';
import { WorkspaceSelector } from '@/components/workspace/WorkspaceSelector';
import { ChannelList } from '@/components/channels/ChannelList';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const { data: organizations, isLoading: orgsLoading } = useOrganizations();
  const { currentWorkspace } = useWorkspaceStore();
  const { data: channels } = useChannels(currentWorkspace?._id || '');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">TeamHub</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <WorkspaceSelector />
          {currentWorkspace && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Channels
                </h3>
                <Link to={`/workspaces/${currentWorkspace._id}/channels/new`}>
                  <Button size="sm" variant="ghost">+</Button>
                </Link>
              </div>
              <ChannelList workspaceId={currentWorkspace._id} />
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-2">{user?.username}</div>
          <Button onClick={logout} variant="outline" className="w-full">
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {currentWorkspace ? currentWorkspace.name : 'Dashboard'}
              </h2>
              {currentWorkspace?.description && (
                <p className="text-sm text-gray-600 mt-1">{currentWorkspace.description}</p>
              )}
            </div>
            <NotificationBell />
          </div>
        </header>

        <div className="p-6">
          {workspacesLoading || orgsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
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
      </main>
    </div>
  );
}
