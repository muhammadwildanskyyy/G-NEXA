import type { NextFunction, Request, Response } from "express";
import response from "../../utils/response";
import { type TUserLogin } from "../../validation/user.validation";
import type { IReqUser } from "../../model/user.model";
import { logger } from "../../lib/logger";
import { HttpStatus } from "../../constants/httpStatus";
import { authService, AuthService } from "../services/auth.service";
import { userService, type UserService } from "../services/user.service";
import type { Prisma } from "../../generated/prisma/client";
import { AppError } from "../../utils/appError";

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params: Prisma.UserCreateInput = req.body;
      const user = await this.authService.register(params);
      logger.info("User Created", { userId: user.id });
      const { password, ...userWithoutPassword } = user;
      return response.success(
        res,
        "User Created",
        userWithoutPassword,
        HttpStatus.CREATED,
      );
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const param: TUserLogin = req.body;
      const token = await this.authService.login(param);
      logger.info("User Success Login", {
        userEmail: req.body.email,
      });
      return response.success(res, "Login Success", { token }, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  me = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return response.unauthorized(res, "Unauthorized");
      }
      console.log(user);

      const result = await this.userService.getUserByEmail(user.user_email);
      if (!result) {
        throw new Error("User Not Founf");
      }
      const { password, ...userWithoutPassword } = result;
      logger.info("Succes get data User", { userId: result?.id });
      return response.success(
        res,
        "success get user profile",
        userWithoutPassword,
        HttpStatus.OK,
      );
    } catch (error) {
      next(error);
    }
  };

  activationUser = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        throw new AppError("code is required", HttpStatus.BAD_REQUEST);
      }

      const result = await this.authService.ActivationUser(code);
      response.success(res, "Success Activation User", result, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController(authService, userService);
