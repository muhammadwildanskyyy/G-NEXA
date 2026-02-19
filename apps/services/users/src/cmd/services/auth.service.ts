import { HttpStatus } from "../../constants/httpStatus";
import { Role, type Prisma, type User } from "../../generated/prisma/client";
import { AppError } from "../../utils/appError";
import { PasswordHelper } from "../../lib/eccryption";
import { generateToken } from "../../lib/jwt";
import type { TUserLogin } from "../../validation/user.validation";
import {
  userRepository,
  type UserRepository,
} from "../repository/user.repository";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}
  register = async (user: Prisma.UserCreateInput): Promise<User> => {
    const userExist = await this.userRepository.findByEmail(user.email);
    if (userExist) {
      throw new AppError(
        "This Email or Phone Number Already Registered",
        HttpStatus.BAD_REQUEST,
      );
    }

    const hasedPassword = await PasswordHelper.hash(user.password);

    const finalUser = {
      ...user,
      password: hasedPassword,
      role: Role.BUYER,
    };
    const UserCreate = await this.userRepository.createUser(finalUser);

    return UserCreate;
  };
  login = async (userData: TUserLogin): Promise<string> => {
    const userExist = await this.userRepository.findByEmail(userData.email);
    if (!userExist) {
      throw new AppError("Email Not Registered", HttpStatus.UNAUTHORIZED);
    }

    const isPasswordMatch = await PasswordHelper.compare(
      userData.password,
      userExist.password,
    );

    if (!isPasswordMatch) {
      throw new AppError(
        "Email and Password Not Match",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = generateToken({
      user_id: userExist.id,
      user_email: userExist.email,
      user_role: userExist.role,
    });

    return token;
  };
}

export const authService = new AuthService(userRepository);
