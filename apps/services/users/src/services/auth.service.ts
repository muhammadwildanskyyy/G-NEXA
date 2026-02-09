import { Role, type Prisma, type User } from "../generated/prisma/client";
import { HTTP_STATUS } from "../model/web.model";
import userRepository from "../repository/user.repository";
import { AppError } from "../utils/appError";
import { PasswordHelper } from "../utils/eccryption";
import { email } from "zod";
import { generateToken } from "../utils/jwt";
import type { TUserLogin } from "../validation/user.validation";

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
      return UserCreate;
    } catch (error) {
      throw error;
    }
  },
  async login(userData: TUserLogin) {
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
        user_id: userExist.id,
        user_email: userExist.email,
        user_role: userExist.role,
      });

      return token;
    } catch (error) {
      throw error;
    }
  },
};
