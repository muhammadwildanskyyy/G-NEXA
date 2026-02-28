import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";
import { HttpStatus } from "../constants/httpStatus";
import { log } from "../lib/logger.ts";

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

  const isProduction = process.env.NODE_ENV === "production";

  // 1. Handling Zod Validation Error (Validation errors are WARN, not ERROR)
  if (err instanceof ZodError) {
    statusCode = HttpStatus.BAD_REQUEST;
    message = "Validation failed";
    isOperational = true;
    details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    log.warn("delivery:http", "Validation Error", { details });
  }

  // 2. Handling Prisma Errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    isOperational = true;
    switch (err.code) {
      case "P2002":
        statusCode = HttpStatus.CONFLICT;
        message = "Data already exists in the system";
        break;
      case "P2025":
        statusCode = HttpStatus.NOT_FOUND;
        message = "Resource not found";
        break;
      case "P2003":
        statusCode = HttpStatus.BAD_REQUEST;
        message = "Invalid relation data";
        break;
      default:
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = "Database operation failed";
        isOperational = false;
        break;
    }

    // If it's a known operational error, we log as warn, otherwise error
    if (isOperational) {
      log.warn("repository:prisma", message, { code: err.code, meta: err.meta });
    } else {
      log.error("repository:prisma", message, err);
    }
  }

  // 3. Handling System/Unexpected Errors
  else {
    // Log unexpected errors with full stack trace
    log.error("delivery:http", `Unexpected Error: ${message}`, err, {
      url: req.originalUrl,
      method: req.method,
    });
  }

  // 4. Response Logic
  return res.status(statusCode).json({
    meta: {
      status: statusCode,
      message: isProduction && !isOperational ? "Internal Server Error" : message,
    },
    data: details || (!isProduction ? {
      error_name: err.name,
      stack: err.stack
    } : null),
  });
};