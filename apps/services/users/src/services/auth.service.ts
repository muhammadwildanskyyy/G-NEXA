import { password } from "bun";
import { Role, type Prisma, type User } from "../generated/prisma/client";
import { logger } from "../lib/logger";
import { HTTP_STATUS } from "../model/web.model";
import userRepository from "../repository/user.repository";
import { AppError } from "../utils/appError";
import { PasswordHelper } from "../utils/eccryption";
import type { UserLogin } from "../validation/user.validation";
import { email } from "zod";
import { generateToken } from "../utils/jwt";

export default {
  async register(user: Prisma.UserCreateInput) {
    try {
      const userExist = await userRepository.findUserByEmailOrPhone(
        user.email,
        user.phoneNumber,
      );
      if (userExist) {
        throw new AppError(
          "This Email or Phone Number Already Registered",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const hasedPassword = await PasswordHelper.hash(user.password);

      const finalUser = {
        ...user,
        password: hasedPassword,
        role: Role.BUYER,
      };
      const UserCreate = await userRepository.createUser(finalUser);
      logger.info("User Created", { userId: UserCreate.id });
      return UserCreate;
    } catch (error) {
      throw error;
    }
  },
  async login(userData: UserLogin) {
    try {
      const userExist = await userRepository.findUserByEmailOrPhone(
        userData.email,
      );

      if (!userExist) {
        throw new AppError("Email Not Registered", HTTP_STATUS.UNAUTHORIZED);
      }

      const isPasswordMatch = await PasswordHelper.compare(
        userData.password,
        userExist.password,
      );

      if (!isPasswordMatch) {
        throw new AppError(
          "Email and Password Not Match",
          HTTP_STATUS.UNAUTHORIZED,
        );
      }

      const token = generateToken({
        id: userExist.id,
        email: userExist.email,
      });

      return token;
    } catch (error) {
      throw error;
    }
  },
};
