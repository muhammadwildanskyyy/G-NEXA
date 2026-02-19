import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";
import { HttpStatus } from "../constants/httpStatus";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";
  let isOperational = err.isOperational || false;
  let details = null;
  // 1. Handling Zod Validation Error
  if (err instanceof ZodError) {
    statusCode = HttpStatus.BAD_REQUEST;
    message = "Validasi data gagal";
    isOperational = true;
    details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  // 2. Handling Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    isOperational = true;
    switch (err.code) {
      case "P2002":
        statusCode = HttpStatus.CONFLICT;
        message = "Data sudah terdaftar di sistem";
        break;
      case "P2025":
        statusCode = HttpStatus.NOT_FOUND;
        message = "Data tidak ditemukan";
        break;
      case "P2003":
        statusCode = HttpStatus.BAD_REQUEST;
        message = "Data relasi tidak valid";
        break;
      default:
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = "Terjadi kesalahan pada database";
        isOperational = false;
        break;
    }
  }

  // 3. Logging
  logger.error({
    url: req.originalUrl,
    method: req.method,
    statusCode,
    message: err.message,
    stack: err.stack,
  });

  // 4. Response Logic
  const isProduction = process.env.NODE_ENV === "production";

  return res.status(statusCode).json({
    meta: {
      status: statusCode,
      message:
        isProduction && !isOperational
          ? "Terjadi kesalahan internal pada server"
          : message,
    },
    data: details || (!isProduction ? { stack: err.stack } : null),
  });
};
