import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorUtil } from '../utils/error.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = ErrorUtil.createErrorResponse(exception as Error, request.url);

    // Log error
    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${errorResponse.statusCode}`,
        exception instanceof Error ? exception.stack : undefined
      );
    } else if (errorResponse.statusCode >= 400) {
      this.logger.warn(`${request.method} ${request.url} - ${errorResponse.statusCode}`);
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }
}
