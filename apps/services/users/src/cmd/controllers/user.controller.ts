import type { NextFunction, Response } from "express";
import type { IReqUser } from "../../model/user.model";
import { userUpdateSchema } from "../../validation/user.validation";
import response from "../../utils/response";

import { logger } from "../../lib/logger";
import { HttpStatus } from "../../constants/httpStatus";
import { userService, type UserService } from "../services/user.service";
import type { Prisma } from "../../generated/prisma/client";

export class UserController {
  constructor(private readonly userService: UserService) {}
  updateUser = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.user_id;
      if (!userId) {
        return response.unauthorized(res, "Unauthorized");
      }
      const params: Prisma.UserUpdateInput = userUpdateSchema.parse(req.body);
      const result = await this.userService.updateUser(userId, params);
      logger.info("User Updated", { userId: result.id });
      response.success(res, "Succes Update User", result, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController(userService);
