import type { Prisma } from "../generated/prisma/client";
import userRepository from "../repository/user.repository";

export default {
  async getUserByEmail(email: string) {
    try {
      return await userRepository.findUserByEmailOrPhone(email);
    } catch (error) {
      throw error;
    }
  },

  async updateUser(userId: string, userData: Prisma.UserUpdateInput) {
    try {
      const Userupdate = await userRepository.updateUser(userId, userData);
      return Userupdate;
    } catch (error) {
      throw error;
    }
  },
};
