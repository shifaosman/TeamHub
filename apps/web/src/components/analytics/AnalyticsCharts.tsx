import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { TimeSeriesPoint } from '@/lib/analyticsApi';
import { cn } from '@/lib/utils';

const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  muted: 'hsl(var(--muted-foreground))',
  created: 'hsl(217, 91%, 60%)',
  completed: 'hsl(142, 71%, 45%)',
  messages: 'hsl(262, 83%, 58%)',
  pie: ['hsl(217, 91%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(280, 67%, 58%)', 'hsl(0, 72%, 51%)'],
};

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface TasksOverTimeChartProps {
  created: TimeSeriesPoint[];
  completed: TimeSeriesPoint[];
  className?: string;
}

export function TasksOverTimeChart({ created, completed, className }: TasksOverTimeChartProps) {
  const createdByDate = new Map(created.map((p) => [p.date, p.count]));
  const completedByDate = new Map(completed.map((p) => [p.date, p.count]));
  const allDates = Array.from(
    new Set([...createdByDate.keys(), ...completedByDate.keys()])
  ).sort();
  const data = allDates.map((date) => ({
    date,
    label: formatChartDate(date),
    created: createdByDate.get(date) ?? 0,
    completed: completedByDate.get(date) ?? 0,
  }));

  if (data.length === 0) {
    return (
      <div className={cn('flex h-[280px] items-center justify-center rounded-xl border border-border/60 bg-muted/20', className)}>
        <p className="text-sm text-muted-foreground">No task data in this period</p>
      </div>
    );
  }

  return (
    <div className={cn('h-[280px] w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
            }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date && formatChartDate(payload[0].payload.date)}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => <span className="text-muted-foreground">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="created"
            name="Created"
            stroke={CHART_COLORS.created}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke={CHART_COLORS.completed}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface MessagesOverTimeChartProps {
  data: TimeSeriesPoint[];
  className?: string;
}

export function MessagesOverTimeChart({ data: raw, className }: MessagesOverTimeChartProps) {
  const data = raw.map((p) => ({ ...p, label: formatChartDate(p.date) }));

  if (data.length === 0) {
    return (
      <div className={cn('flex h-[240px] items-center justify-center rounded-xl border border-border/60 bg-muted/20', className)}>
        <p className="text-sm text-muted-foreground">No messages in this period</p>
      </div>
    );
  }

  return (
    <div className={cn('h-[240px] w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
            }}
          />
          <Bar dataKey="count" name="Messages" fill={CHART_COLORS.messages} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TaskStatusChartProps {
  byStatus: { status: string; count: number }[];
  className?: string;
}

export function TaskStatusChart({ byStatus, className }: TaskStatusChartProps) {
  const data = byStatus.map((s) => ({ name: s.status, value: s.count }));

  if (data.length === 0) {
    return (
      <div className={cn('flex h-[220px] items-center justify-center rounded-xl border border-border/60 bg-muted/20', className)}>
        <p className="text-sm text-muted-foreground">No tasks yet</p>
      </div>
    );
  }

  return (
    <div className={cn('h-[220px] w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS.pie[i % CHART_COLORS.pie.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TaskPriorityChartProps {
  byPriority: { priority: string; count: number }[];
  className?: string;
}

export function TaskPriorityChart({ byPriority, className }: TaskPriorityChartProps) {
  const data = byPriority.map((p) => ({ name: p.priority, count: p.count }));

  if (data.length === 0) {
    return (
      <div className={cn('flex h-[200px] items-center justify-center rounded-xl border border-border/60 bg-muted/20', className)}>
        <p className="text-sm text-muted-foreground">No tasks yet</p>
      </div>
    );
  }

  return (
    <div className={cn('h-[200px] w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 60, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
            }}
          />
          <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
