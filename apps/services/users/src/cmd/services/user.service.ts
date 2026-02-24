import { HttpStatus } from "../../constants/httpStatus";
import type { Prisma, User } from "../../generated/prisma/client";
import { AppError } from "../../utils/appError";
import {
  userRepository,
  type UserRepository,
} from "../repository/user.repository";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
  getUserByEmail = async (email: string): Promise<User> => {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("User Not Found", HttpStatus.NOT_FOUND);
    }
    return user;
  };

  updateUser = async (
    userId: string,
    userData: Prisma.UserUpdateInput,
  ): Promise<User> => {
    const UserUpdate = await this.userRepository.updateUser(userId, userData);
    return UserUpdate;
  };
}

export const userService = new UserService(userRepository);
