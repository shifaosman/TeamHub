import { cn } from '@/lib/utils';

interface AnalyticsKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function AnalyticsKpiCard({ title, value, subtitle, icon, className }: AnalyticsKpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </p>
          {subtitle != null && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon != null && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
