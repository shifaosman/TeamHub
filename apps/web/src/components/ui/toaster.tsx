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
          className={`rounded-lg border p-4 shadow-lg bg-white ${
            toast.variant === 'error'
              ? 'border-red-200 bg-red-50'
              : toast.variant === 'success'
              ? 'border-green-200 bg-green-50'
              : toast.variant === 'warning'
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {toast.title && (
                <div className="font-semibold text-gray-900 mb-1">{toast.title}</div>
              )}
              <div className="text-sm text-gray-700">{toast.description}</div>
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
