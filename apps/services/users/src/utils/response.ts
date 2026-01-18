import type { Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";
import { logger } from "../lib/logger";
import { HTTP_STATUS } from "../model/web.model";

export default {
  success(res: Response, message: string, data: any, status: number) {
    return res.status(status).json({
      meta: {
        message,
        status,
      },
      data,
    });
  },
  error(res: Response, error: unknown, message: string) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];

      const fieldPath = firstIssue?.path.join(".") ?? "unknown";
      const errorMessage = firstIssue?.message ?? "Validation failed";

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        meta: {
          status: HTTP_STATUS.BAD_REQUEST,
          message: errorMessage,
        },
        data: {
          [fieldPath]: errorMessage,
        },
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 "Unique constraint failed" (Duplicate)
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[])?.join(", ") || "field";
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          meta: {
            status: HTTP_STATUS.BAD_REQUEST,
            message: `Data ${target} sudah terdaftar.`,
          },
          data: error.meta, // Memberikan detail field mana yang duplicate
        });
      }

      // P2025 "An operation failed because it depends on one or more records that were not found"
      if (error.code === "P2025") {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          meta: {
            status: HTTP_STATUS.NOT_FOUND,
            message: "Data tidak ditemukan.",
          },
          data: null,
        });
      }

      // Default for error Prisma
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        meta: {
          status: HTTP_STATUS.BAD_REQUEST,
          message: `Database error: ${error.code}`,
        },
        data: error.meta,
      });
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        meta: {
          status: HTTP_STATUS.BAD_REQUEST,
          message: "Format data yang dikirim ke database tidak valid.",
        },
        data: null,
      });
    }

    const statusCode =
      (error as any)?.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    return res.status(statusCode).json({
      meta: {
        status: statusCode,
        message: message || "Internal Server Error",
      },
      data: null,
    });
  },
  unauthorized(res: Response, message: string = "unauthorized") {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      meta: {
        status: HTTP_STATUS.UNAUTHORIZED,
        message,
      },
      data: null,
    });
  },
};
