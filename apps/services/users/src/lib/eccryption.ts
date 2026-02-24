import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const PasswordHelper = {
  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  },

  async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  },
};
