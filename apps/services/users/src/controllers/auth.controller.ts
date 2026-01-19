import type { NextFunction, Request, Response } from "express";
import authService from "../services/auth.service";
import response from "../utils/response";
import { HTTP_STATUS } from "../model/web.model";
import {
  userLoginSchema,
  userRegisterSchema,
} from "../validation/user.validation";
import type { IReqUser } from "../model/user.model";
import userService from "../services/user.service";
import { logger } from "../lib/logger";

export default {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const userValidate = userRegisterSchema.parse(req.body);
      const user = await authService.register(userValidate);
      logger.info("User Created", { userId: user.id });
      return response.success(res, "User Created", user, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  },
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const userLoginvalidated = userLoginSchema.parse(req.body);
      const token = await authService.login(userLoginvalidated);
      logger.info("User Success Login", {
        userEmail: userLoginvalidated.email,
      });
      return response.success(res, "Login Success", { token }, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  },
  async me(req: IReqUser, res: Response, next: NextFunction) {
    try {
      const user = req.user;

      if (!user) {
        return response.unauthorized(res, "Unauthorized");
      }

      const result = await userService.getUserByEmail(user.email);

      logger.info("Succes get data User", { userId: result?.id });
      return response.success(
        res,
        "success get user profile",
        result,
        HTTP_STATUS.OK,
      );
    } catch (error) {
      next(error);
    }
  },
};
