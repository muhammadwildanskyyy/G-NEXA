import type { User } from "../../generated/prisma/client";
import type { Prisma, PrismaClient } from "../../generated/prisma/client";
import { database } from "../../lib/database";

export class UserRepository {
  constructor(private readonly database: PrismaClient) {}
  createUser = async (user: Prisma.UserCreateInput): Promise<User> => {
    return await this.database.user.create({ data: user });
  };

  findByEmail = async (email: string): Promise<User | null> => {
    return await this.database.user.findFirst({
      where: {
        email: email,
      },
    });
  };

  findByPhone = async (phoneNumber: string): Promise<User | null> => {
    return await this.database.user.findFirst({
      where: {
        phoneNumber: phoneNumber,
      },
    });
  };

  findUserById = async (userId: string): Promise<User | null> => {
    return await this.database.user.findUnique({ where: { id: userId } });
  };

  updateUser = async (
    userId: string,
    userData: Prisma.UserUpdateInput,
  ): Promise<User> => {
    return this.database.user.update({
      where: { id: userId },
      data: userData,
    });
  };
}

export const userRepository = new UserRepository(database);
