export class PerformanceUtil {
  static measureAsync<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    return fn().finally(() => {
      const duration = performance.now() - start;
      if (duration > 1000) {
        console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms`);
      }
    });
  }

  static measureSync<T>(label: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      if (duration > 100) {
        console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms`);
      }
    }
  }
}
