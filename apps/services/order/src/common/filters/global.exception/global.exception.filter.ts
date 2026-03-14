import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppException } from './app.exception';
import { AppLogger } from '../../../infrastructure/logger/app.logger';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let isOperational = false;
    let details: unknown = null;

    let originalErrorMessage = 'Unknown Error';
    if (exception instanceof Error) {
      originalErrorMessage = exception.message;
    }

    // 1. Handling Zod Validation Error
    if (exception instanceof ZodError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Data validation failed';
      isOperational = true;
      details = exception.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
    }
    // 2. Handling Prisma Database Error
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      isOperational = true;
      switch (String(exception.code)) {
        case 'P2002':
          statusCode = HttpStatus.CONFLICT;
          message = 'Data already exists in the system';
          break;
        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          message = 'Data not found';
          break;
        case 'P2003':
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Invalid relational data';
          break;
        default:
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'A database error occurred';
          isOperational = false;
          break;
      }
    }
    // 3. Handling Custom App Exception
    else if (exception instanceof AppException) {
      statusCode = exception.getStatus();
      isOperational = true;

      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = typeof resObj.message === 'string' ? resObj.message : message;
        details = resObj.meta ?? null;
      } else if (typeof res === 'string') {
        message = res;
      }
    }
    // 4. Handling Standard NestJS HttpException
    else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      message = exception.message;
      isOperational = true;

      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        if (resObj.message) {
          details = resObj.message;
        }
      }
    }

    // 5. GNEXA Logging Execution
    const errorMeta = {
      url: request.originalUrl || request.url,
      method: request.method,
      status: statusCode,
      is_operational: isOperational,
      details: details,
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.err(
        'filter:exception',
        `Server Error: ${originalErrorMessage}`,
        exception,
        errorMeta,
      );
    } else {
      this.logger.warning(
        'filter:exception',
        `Client Error: ${message}`,
        errorMeta,
      );
    }

    const isProduction =
      process.env.NODE_ENV === 'production' ||
      process.env.APP_ENV === 'production';

    // 6. Final JSON Response
    return response.status(statusCode).json({
      meta: {
        code: statusCode,
        message:
          isProduction && !isOperational
            ? 'An internal server error occurred'
            : message,
      },
      data:
        details !== null
          ? details
          : !isProduction && exception instanceof Error
            ? { stack: exception.stack }
            : null,
    });
  }
}
