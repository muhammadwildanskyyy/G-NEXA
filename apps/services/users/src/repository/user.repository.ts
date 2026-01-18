import type { Prisma, User } from "../generated/prisma/client";
import { prisma } from "../lib/database";
import { AppError } from "../utils/appError";

export default {
  async createUser(user: Prisma.UserCreateInput) {
    try {
      return await prisma.user.create({ data: user });
    } catch (error) {
      throw error;
    }
  },
  async findUserByEmailOrPhone(email: string, phoneNumber?: string | null) {
    return await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          {
            phoneNumber: phoneNumber ? phoneNumber : undefined,
          },
        ],
      },
    });
  },

  async updateUser() {},
};
