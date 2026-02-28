import type { NextFunction, Response } from "express";
import type { IReqUser } from "../../model/user.model";
import { userUpdateSchema } from "../../validation/user.validation";
import response from "../../utils/response";

import { HttpStatus } from "../../constants/httpStatus";
import { userService, type UserService } from "../services/user.service";
import type { Prisma } from "../../generated/prisma/client";
import { log } from "../../lib/logger"; // Import the custom logger

export class UserController {
  constructor(private readonly userService: UserService) {}

  updateUser = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        log.warn("delivery:http", "User update denied: Unauthorized user or missing token");
        return response.unauthorized(res, "Unauthorized");
      }

      // Note: If Zod validation fails here, it throws an error that goes to the catch block
      const params: Prisma.UserUpdateInput = userUpdateSchema.parse(req.body);
      const result = await this.userService.updateUser(userId, params);

      log.info("delivery:http", "User profile update response sent", { user_id: userId });
      response.success(res, "Success Update User", result, HttpStatus.OK);
    } catch (error) {
      next(error); // Validation errors (Zod) and system errors will be caught by the global error handler
    }
  };
}

export const userController = new UserController(userService);