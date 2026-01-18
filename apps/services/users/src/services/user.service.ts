import userRepository from "../repository/user.repository";

export default {
  async getUserByEmail(email: string) {
    try {
      return await userRepository.findUserByEmailOrPhone(email);
    } catch (error) {
      throw error;
    }
  },
};
