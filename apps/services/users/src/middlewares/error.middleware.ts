import type { Request, Response, NextFunction } from "express";
import response from "../utils/response";
import { logger } from "../lib/logger";
import { HTTP_STATUS } from "../model/web.model";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Set default status code
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";
  let isOperational = err.isOperational || false;

  if (err instanceof ZodError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    isOperational = true;
  }

  // 2. Handling Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": // Unique constraint failed (Duplicate)
        statusCode = HTTP_STATUS.CONFLICT;
        message = "Data sudah terdaftar di sistem";
        isOperational = true;
        break;
      case "P2025": // Record not found
        statusCode = HTTP_STATUS.NOT_FOUND;
        message = "Data tidak ditemukan";
        isOperational = true;
        break;
      case "P2003": // Foreign key constraint failed
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = "Data relasi tidak valid";
        isOperational = true;
        break;
      default:
        statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        break;
    }
  }

  logger.error({
    url: req.originalUrl,
    method: req.method,
    statusCode: statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    stack: err.stack,
  });

  //prtoduction and operational error
if (process.env.NODE_ENV === "production") {
  return res.status(statusCode).json({
    meta: {
      status: statusCode,
      message: isOperational
        ? message
        : "Terjadi kesalahan internal pada server",
    },
    data: null,
  });
}

  // development error
  return response.error(res, err, err.message);
};
