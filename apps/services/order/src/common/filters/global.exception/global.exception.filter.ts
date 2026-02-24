// src/infrastructure/filters/global-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod/v3';
import { Prisma } from '@prisma/client';
import { AppException } from './app.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const excaptionType = typeof exception;
    console.log('excaptionType: ', excaptionType);
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

    if (exception instanceof ZodError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Validasi data gagal';
      isOperational = true;
      details = exception.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      console.log('ini detail : ', details);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      isOperational = true;
      switch (exception.code) {
        case 'P2002':
          statusCode = HttpStatus.CONFLICT;
          message = 'Data sudah terdaftar di sistem';
          break;
        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          message = 'Data tidak ditemukan';
          break;
        case 'P2003':
          statusCode = HttpStatus.BAD_REQUEST;
          message = 'Data relasi tidak valid';
          break;
        default:
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Terjadi kesalahan pada database';
          isOperational = false;
          break;
      }
    } else if (exception instanceof AppException) {
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
    } else if (exception instanceof HttpException) {
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

    this.logger.error({
      url: request.originalUrl || request.url,
      method: request.method,
      statusCode,
      message: originalErrorMessage,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    const isProduction = process.env.NODE_ENV === 'production';

    return response.status(statusCode).json({
      meta: {
        status: statusCode,
        message:
          isProduction && !isOperational
            ? 'Terjadi kesalahan internal pada server'
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
