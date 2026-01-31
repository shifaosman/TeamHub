import { useToast } from '@/hooks/useToast';
import { X } from 'lucide-react';
import { Button } from './button';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border p-4 shadow-lg bg-card text-card-foreground border-border ${
            toast.variant === 'error'
              ? 'border-destructive/40 bg-destructive/10'
              : toast.variant === 'success'
              ? 'border-green-500/40 bg-green-500/10'
              : toast.variant === 'warning'
              ? 'border-yellow-500/40 bg-yellow-500/10'
              : ''
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {toast.title && (
                <div className="font-semibold mb-1">{toast.title}</div>
              )}
              <div className="text-sm text-muted-foreground">{toast.description}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={() => dismiss(toast.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
