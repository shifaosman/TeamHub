import { Logger } from '@nestjs/common';

export function PerformanceLog(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  const logger = new Logger(target.constructor.name);

  descriptor.value = async function (...args: any[]) {
    const start = Date.now();
    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - start;
      if (duration > 1000) {
        logger.warn(`${propertyName} took ${duration}ms`);
      }
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`${propertyName} failed after ${duration}ms: ${error}`);
      throw error;
    }
  };
}
