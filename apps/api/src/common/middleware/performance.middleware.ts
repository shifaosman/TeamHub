import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Performance');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, originalUrl } = req;
      const { statusCode } = res;

      // Log slow requests (> 1 second)
      if (duration > 1000) {
        this.logger.warn(
          `Slow request: ${method} ${originalUrl} - ${statusCode} - ${duration}ms`
        );
      }

      // Log very slow requests (> 5 seconds)
      if (duration > 5000) {
        this.logger.error(
          `Very slow request: ${method} ${originalUrl} - ${statusCode} - ${duration}ms`
        );
      }
    });

    next();
  }
}
