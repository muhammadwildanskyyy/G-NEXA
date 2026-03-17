import { HttpStatus } from "../../constants/httpStatus";
import type { Prisma, User } from "../../generated/prisma/client";
import { AppError } from "../../utils/appError";
import {
  userRepository,
  type UserRepository,
} from "../repository/user.repository";
import { log } from "../../lib/logger"; // Import the custom logger
import { redis } from "../../infrastructure/redis";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  getUserByEmail = async (email: string): Promise<User> => {
    const cacheKey = `user:email:${email}`;
    const cachedUser = await redis.get(cacheKey);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      log.warn("service:user", "User retrieval failed: User not found", { email });
      throw new AppError("User Not Found", HttpStatus.NOT_FOUND);
    }

    await redis.setex(cacheKey, 300, JSON.stringify(user)); // 5 minutes TTL
    return user;
  };

  getUserById = async (userId: string): Promise<User> => {
    const cacheKey = `user:id:${userId}`;
    const cachedUser = await redis.get(cacheKey);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      log.warn("service:user", "User retrieval failed: User not found", { user_id: userId });
      throw new AppError("User Not Found", HttpStatus.NOT_FOUND);
    }

    await redis.setex(cacheKey, 300, JSON.stringify(user)); // 5 minutes TTL
    return user;
  };

  updateUser = async (
      userId: string,
      userData: Prisma.UserUpdateInput,
  ): Promise<User> => {
    const userUpdate = await this.userRepository.updateUser(userId, userData);

    // Invalidate cache
    await redis.del(`user:id:${userId}`);
    if (userUpdate.email) {
      await redis.del(`user:email:${userUpdate.email}`);
    }

    log.info("service:user", "User profile successfully updated", { user_id: userId });
    return userUpdate;
  };
}

export const userService = new UserService(userRepository);