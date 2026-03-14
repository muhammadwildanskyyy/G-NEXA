import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/appError";
import { HttpStatus } from "../constants/httpStatus";
import { Messages } from "../constants/messages";


export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {

      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {

        next(error);
        return;
      }
      next(error);
    }
  };
};
