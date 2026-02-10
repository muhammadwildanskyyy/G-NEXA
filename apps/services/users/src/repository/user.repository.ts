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

  async findByEmail(email: string) {
    return await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
  },

  async findByPhone(phoneNumber: string) {
    return await prisma.user.findFirst({
      where: {
        phoneNumber: phoneNumber,
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
