import { HttpStatus } from "../../constants/httpStatus";
import type { Prisma, User } from "../../generated/prisma/client";
import { AppError } from "../../utils/appError";
import {
  userRepository,
  type UserRepository,
} from "../repository/user.repository";
import { log } from "../../lib/logger"; // Import the custom logger

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  getUserByEmail = async (email: string): Promise<User> => {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      log.warn("service:user", "User retrieval failed: User not found", { email });
      throw new AppError("User Not Found", HttpStatus.NOT_FOUND);
    }

    // Silent read on success to keep the terminal clean
    return user;
  };

  updateUser = async (
      userId: string,
      userData: Prisma.UserUpdateInput,
  ): Promise<User> => {
    const UserUpdate = await this.userRepository.updateUser(userId, userData);

    log.info("service:user", "User profile successfully updated", { user_id: userId });
    return UserUpdate;
  };
}

export const userService = new UserService(userRepository);