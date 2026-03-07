import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaces, useOrganizations } from '@/hooks/useWorkspaces';
import { useChannels } from '@/hooks/useChannels';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useActivity } from '@/hooks/useActivity';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';
import { InviteMembersDialog } from '@/components/workspace/InviteMembersDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import {
  MessageSquare,
  FolderKanban,
  Building2,
  LayoutGrid,
  Bell,
  Inbox,
} from 'lucide-react';

export function DashboardPage() {
  useAuth();
  const { data: workspaces, isLoading: workspacesLoading, error: workspacesError } = useWorkspaces();
  const { data: organizations, isLoading: orgsLoading, error: orgsError } = useOrganizations();
  const { currentWorkspace } = useWorkspaceStore();
  const { data: channels, isLoading: channelsLoading, error: channelsError } = useChannels(
    currentWorkspace?._id || ''
  );
  const { data: projects, isLoading: projectsLoading } = useProjects(currentWorkspace?._id || '');
  const { data: activity, isLoading: activityLoading, error: activityError } = useActivity({
    workspaceId: currentWorkspace?._id,
    limit: 10,
  });
  const [inviteOpen, setInviteOpen] = useState(false);

  useMessageNotifications();

  const hasError = workspacesError || orgsError || channelsError;
  const isLoading = workspacesLoading || orgsLoading;

  return (
    <MainLayout>
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {currentWorkspace ? currentWorkspace.name : 'Dashboard'}
          </h1>
          {currentWorkspace?.description && (
            <p className="mt-1 text-sm text-muted-foreground">{currentWorkspace.description}</p>
          )}
        </div>
      </header>

      <div className="p-6">
        {hasError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">
              {workspacesError?.message || orgsError?.message || channelsError?.message}
            </p>
          </div>
        )}

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-8">
            {/* Quick actions / Get started */}
            {(!workspaces || workspaces.length === 0) && (
              <EmptyState
                icon={<LayoutGrid className="h-6 w-6" />}
                title="Get started"
                description="Create an organization and workspace to start collaborating with your team."
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link to="/organizations/new">
                      <Button className="rounded-lg shadow-sm">Create organization</Button>
                    </Link>
                    {organizations && organizations.length > 0 && (
                      <Link to="/workspaces/new">
                        <Button variant="outline" className="rounded-lg">
                          Create workspace
                        </Button>
                      </Link>
                    )}
                  </div>
                }
              />
            )}

            {currentWorkspace && (
              <>
                {/* Top row: Activity + Projects */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        Recent activity
                      </h2>
                    </div>
                    {activityLoading ? (
                      <ActivitySkeleton />
                    ) : (
                      <ActivityFeed
                        workspaceId={currentWorkspace._id}
                        items={activity || []}
                        isLoading={activityLoading}
                        error={activityError}
                      />
                    )}
                  </section>

                  <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        Active projects
                      </h2>
                      <Link to="/projects">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                          View all
                        </Button>
                      </Link>
                    </div>
                    {projectsLoading ? (
                      <ProjectsSkeleton />
                    ) : projects && projects.length > 0 ? (
                      <ul className="space-y-2">
                        {projects.slice(0, 5).map((project) => (
                          <li key={project._id}>
                            <Link
                              to={`/projects/${project._id}`}
                              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                            >
                              <span className="font-medium text-foreground">{project.name}</span>
                              <span className="text-xs text-muted-foreground">Open board →</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState
                        icon={<FolderKanban className="h-5 w-5" />}
                        title="No projects yet"
                        description="Create a project to track tasks on a Kanban board."
                        action={
                          <Link to="/projects">
                            <Button size="sm" variant="outline" className="rounded-lg">
                              Go to projects
                            </Button>
                          </Link>
                        }
                        className="py-8"
                      />
                    )}
                  </section>
                </div>

                {/* Channels + Workspace info */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        Channels
                      </h2>
                      <Link to={`/workspaces/${currentWorkspace._id}/channels/new`}>
                        <Button size="sm" variant="outline" className="rounded-lg">
                          New channel
                        </Button>
                      </Link>
                    </div>
                    {channelsLoading ? (
                      <ChannelsSkeleton />
                    ) : channels && channels.length > 0 ? (
                      <ul className="space-y-1">
                        {channels.slice(0, 6).map((channel) => (
                          <li key={channel._id}>
                            <Link
                              to={`/channels/${channel._id}`}
                              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                            >
                              <span className="text-muted-foreground">#</span>
                              <span className="font-medium text-foreground">{channel.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState
                        icon={<MessageSquare className="h-5 w-5" />}
                        title="No channels yet"
                        description="Create a channel to start conversations."
                        action={
                          <Link to={`/workspaces/${currentWorkspace._id}/channels/new`}>
                            <Button size="sm" variant="outline" className="rounded-lg">
                              Create channel
                            </Button>
                          </Link>
                        }
                        className="py-8"
                      />
                    )}
                  </section>

                  <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Workspace
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setInviteOpen(true)}
                      >
                        Invite
                      </Button>
                    </div>
                    <div className="space-y-3 rounded-lg bg-muted/30 p-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Name</p>
                        <p className="text-sm font-medium text-foreground">{currentWorkspace.name}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Slug</p>
                        <p className="text-sm text-foreground">{currentWorkspace.slug}</p>
                      </div>
                      {currentWorkspace.description && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Description</p>
                          <p className="text-sm text-foreground">{currentWorkspace.description}</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Assigned tasks CTA */}
                <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-4 w-4 text-muted-foreground" />
                      <h2 className="text-sm font-semibold text-foreground">Your tasks</h2>
                    </div>
                    <Link to="/projects">
                      <Button variant="outline" size="sm" className="rounded-lg">
                        View project boards
                      </Button>
                    </Link>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Open a project board to see and manage tasks assigned to you.
                  </p>
                </section>
              </>
            )}

            <InviteMembersDialog
              workspaceId={currentWorkspace?._id || ''}
              open={inviteOpen}
              onOpenChange={setInviteOpen}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

function ChannelsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}
