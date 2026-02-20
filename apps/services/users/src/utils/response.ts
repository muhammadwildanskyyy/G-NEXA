import type { Response } from "express";
import { HttpStatus } from "../constants/httpStatus";

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
  unauthorized(res: Response, message: string = "unauthorized") {
    res.status(HttpStatus.UNAUTHORIZED).json({
      meta: {
        status: HttpStatus.UNAUTHORIZED,
        message,
      },
      data: null,
    });
  },
  notFound(res: Response, message: string) {
    res.status(HttpStatus.NOT_FOUND).json({
      meta: {
        status: HttpStatus.NOT_FOUND,
        message,
      },
      data: null,
    });
  },
};
