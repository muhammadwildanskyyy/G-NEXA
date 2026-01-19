import type { NextFunction, Response } from "express";
import type { IReqUser } from "../model/user.model";
import {
  userUpdateSchema,
  type TUserUpdate,
} from "../validation/user.validation";
import response from "../utils/response";
import userService from "../services/user.service";
import { HTTP_STATUS } from "../model/web.model";
import { logger } from "../lib/logger";

export default {
  async updateUser(req: IReqUser, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return response.unauthorized(res, "Unauthorized");
      }
      const userData: TUserUpdate = userUpdateSchema.parse(req.body);
      const result = await userService.updateUser(userId, userData);
      logger.info("User Updated", { userId: result.id });
      response.success(res, "Succes Update User", result, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  },
};
