import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatus";
import { Messages } from "../constants/messages";
import { logger } from "../lib/logger";

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      logger.debug("[Middleware: validateRequest] Validating request body");
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn("[Middleware: validateRequest] Validation failed", {
          issues: error.issues,
        });
        next(error);
        return;
      }
      next(error);
    }
  };
};
