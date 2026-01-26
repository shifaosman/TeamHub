import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path: string;
}

export class ErrorUtil {
  static createErrorResponse(
    exception: HttpException | Error,
    path: string
  ): ErrorResponse {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception.message;

    return {
      statusCode: status,
      message: typeof message === 'string' ? message : (message as any).message || message,
      error: HttpStatus[status],
      timestamp: new Date().toISOString(),
      path,
    };
  }

  static isOperationalError(error: Error): boolean {
    return error instanceof HttpException;
  }
}
