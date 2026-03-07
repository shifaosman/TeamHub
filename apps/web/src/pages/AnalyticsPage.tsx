import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useWorkspaceAnalytics } from '@/hooks/useAnalytics';
import type { AnalyticsPeriod } from '@/lib/analyticsApi';
import { AnalyticsKpiCard } from '@/components/analytics/AnalyticsKpiCard';
import {
  TasksOverTimeChart,
  MessagesOverTimeChart,
  TaskStatusChart,
  TaskPriorityChart,
} from '@/components/analytics/AnalyticsCharts';
import { ProjectProgressList } from '@/components/analytics/ProjectProgressList';
import { ActiveChannelsList } from '@/components/analytics/ActiveChannelsList';
import { ActiveUsersList } from '@/components/analytics/ActiveUsersList';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  CheckSquare,
  FolderKanban,
  Users,
  Upload,
  MessageSquare,
  StickyNote,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export function AnalyticsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const effectiveWorkspaceId = workspaceId || currentWorkspace?._id || '';

  const { data, isLoading, isError, error } = useWorkspaceAnalytics(effectiveWorkspaceId, period);

  return (
    <MainLayout>
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
          {effectiveWorkspaceId && (
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPeriod(opt.value)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    period === opt.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="p-6">
        {!effectiveWorkspaceId ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 py-16 px-6 text-center">
            <p className="text-muted-foreground">Select a workspace to view analytics.</p>
            <Link to="/dashboard" className="mt-4 text-sm font-medium text-primary hover:underline">
              Go to Dashboard
            </Link>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-border bg-destructive/5 px-6 py-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <p className="mt-2 font-medium text-foreground">Failed to load analytics</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {(error as Error)?.message ?? 'Please try again later.'}
            </p>
          </div>
        ) : isLoading || !data ? (
          <AnalyticsSkeleton />
        ) : (
          <div className="space-y-8">
            {/* KPI cards */}
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Overview
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <AnalyticsKpiCard
                  title="Total tasks"
                  value={data.overview.totalTasks}
                  icon={<CheckSquare className="h-5 w-5" />}
                />
                <AnalyticsKpiCard
                  title="Completed tasks"
                  value={data.overview.completedTasks}
                  subtitle={
                    data.overview.totalTasks > 0
                      ? `${Math.round((data.overview.completedTasks / data.overview.totalTasks) * 100)}% of total`
                      : undefined
                  }
                  icon={<CheckSquare className="h-5 w-5" />}
                />
                <AnalyticsKpiCard
                  title="Active projects"
                  value={data.overview.totalProjects}
                  icon={<FolderKanban className="h-5 w-5" />}
                />
                <AnalyticsKpiCard
                  title="Members"
                  value={data.overview.totalMembers}
                  icon={<Users className="h-5 w-5" />}
                />
              </div>
            </section>

            {/* Tasks over time + Status + Priority */}
            <section className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm lg:col-span-2">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Tasks created vs completed</h3>
                <TasksOverTimeChart
                  created={data.taskAnalytics.createdOverTime}
                  completed={data.taskAnalytics.completedOverTime}
                />
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">By status</h3>
                  <TaskStatusChart byStatus={data.taskAnalytics.byStatus} />
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">By priority</h3>
                  <TaskPriorityChart byPriority={data.taskAnalytics.byPriority} />
                </div>
              </div>
            </section>

            {/* Overdue + Project progress */}
            <section className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Overdue tasks</h3>
                <p className="text-2xl font-semibold tabular-nums text-foreground">
                  {data.taskAnalytics.overdueCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Tasks past due date (not done)</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm lg:col-span-2">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Project progress</h3>
                <ProjectProgressList projects={data.projectAnalytics.projects} />
              </div>
            </section>

            {/* Messages over time */}
            <section>
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Messages over time</h3>
                <MessagesOverTimeChart data={data.collaborationAnalytics.messagesOverTime} />
              </div>
            </section>

            {/* Most active channels + Most active users */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Most active channels</h3>
                <ActiveChannelsList channels={data.collaborationAnalytics.mostActiveChannels} />
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Most active members</h3>
                <ActiveUsersList users={data.collaborationAnalytics.mostActiveUsers} />
              </div>
            </section>

            {/* Collaboration snapshot */}
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Collaboration snapshot
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <StickyNote className="h-4 w-4" />
                    <span className="text-sm font-medium">Notes edited</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                    {data.collaborationAnalytics.notesEditedOverTime.reduce((s, p) => s + p.count, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">In selected period</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm font-medium">Files uploaded</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                    {data.collaborationAnalytics.filesUploadedOverTime.reduce((s, p) => s + p.count, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">In selected period</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm font-medium">Messages posted</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                    {data.collaborationAnalytics.messagesOverTime.reduce((s, p) => s + p.count, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">In selected period</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
