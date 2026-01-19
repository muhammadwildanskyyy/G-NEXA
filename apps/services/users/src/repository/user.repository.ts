import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/database";
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
  async findUserById(userId: string) {
    return await prisma.user.findUnique({ where: { id: userId } });
  },
  async updateUser(userId: string, userData: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id: userId },
      data: userData,
    });
  },
};
