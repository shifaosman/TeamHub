import { useState, useCallback, useEffect } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>(toasts);

  useEffect(() => {
    toastListeners.push(setToastList);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToastList);
    };
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(7);
      const newToast: Toast = { id, title, description, variant, duration };
      toasts = [...toasts, newToast];
      notify();

      if (duration > 0) {
        setTimeout(() => {
          toasts = toasts.filter((t) => t.id !== id);
          notify();
        }, duration);
      }

      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, []);

  return { toast, dismiss, toasts: toastList };
}
