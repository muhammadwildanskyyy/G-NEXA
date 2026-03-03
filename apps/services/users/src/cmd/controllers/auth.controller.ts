import type { NextFunction, Request, Response } from "express";
import response from "../../utils/response";
import { type TUserLogin } from "../../validation/user.validation";
import type { IReqUser } from "../../model/user.model";
import { HttpStatus } from "../../constants/httpStatus";
import { authService, AuthService } from "../services/auth.service";
import { userService, type UserService } from "../services/user.service";
import type { Prisma } from "../../generated/prisma/client";
import { AppError } from "../../utils/appError";
import { log } from "../../lib/logger"; // Import custom logger

export class AuthController {
  constructor(
      private readonly authService: AuthService,
      private readonly userService: UserService,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params: Prisma.UserCreateInput = req.body;
      const user = await this.authService.register(params);

      const { password, ...userWithoutPassword } = user;

      log.info("delivery:http", `User registration successful`, { email: params.email });
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

      log.info("delivery:http", `User login successful`, { email: param.email });
      return response.success(res, "Login Success", { token }, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  me = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        log.warn("delivery:http", `Profile access denied: Invalid or missing token`);
        return response.unauthorized(res, "Unauthorized");
      }

      const result = await this.userService.getUserByEmail(user.user_email);
      if (!result) {
        throw new AppError("User Not Found",HttpStatus.BAD_REQUEST); // Error ini akan masuk ke catch dan ditangani middleware global
      }
      const { password, ...userWithoutPassword } = result;

      // Silent read: no info log here to prevent spamming the terminal
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

  getVerificationCode = async (req: Request, res: Response, next: NextFunction) => {
    try {

      const userEmail = req.body.email;
      if (!userEmail) {
        log.warn("delivery:http", `Profile access denied: Invalid or missing token`);
        return response.unauthorized(res, "email is required");
      }

      const user = await this.userService.getUserByEmail(userEmail);
      await this.authService.sendActivationCode(user)

      return response.success(
          res,
          "success send activation code",
          user,
          HttpStatus.OK,
      );
    }catch (error) {
      next(error);
    }
  }

  activationUser = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        log.warn("delivery:http", `Activation denied: Code parameter is missing`);
        throw new AppError("code is required", HttpStatus.BAD_REQUEST);
      }

      const result = await this.authService.ActivationUser(code);

      log.info("delivery:http", `User activation successful`, { user_id: result.id });
      response.success(res, "Success Activation User", result, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController(authService, userService);