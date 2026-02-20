import { HttpStatus } from "../../constants/httpStatus";
import { Role, type Prisma, type User } from "../../generated/prisma/client";
import { AppError } from "../../utils/appError";
import { PasswordHelper } from "../../lib/eccryption";
import { generateToken } from "../../lib/jwt";
import type { TUserLogin } from "../../validation/user.validation";
import {
  userRepository,
  type UserRepository,
} from "../repository/user.repository";
import { CLIENT_HOST, EMAIL_SMTP_USER } from "../../utils/env";
import { renderMailHtml, sendMail } from "../../utils/mail/mail";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}
  register = async (user: Prisma.UserCreateInput): Promise<User> => {
    const userExist = await this.userRepository.findByEmail(user.email);
    if (userExist) {
      throw new AppError(
        "This Email or Phone Number Already Registered",
        HttpStatus.BAD_REQUEST,
      );
    }

    const hasedPassword = await PasswordHelper.hash(user.password);
    const ActicationCode = await PasswordHelper.hash(user.email);
    const finalUser: Prisma.UserCreateInput = {
      ...user,
      password: hasedPassword,
      role: Role.BUYER,
      activation_code: ActicationCode,
    };

    const UserCreate = await this.userRepository.createUser(finalUser);
    this.sendActivationCode(UserCreate);

    return UserCreate;
  };
  login = async (userData: TUserLogin): Promise<string> => {
    const userExist = await this.userRepository.findByEmail(userData.email);
    if (!userExist) {
      throw new AppError("Email Not Registered", HttpStatus.UNAUTHORIZED);
    }

    const isPasswordMatch = await PasswordHelper.compare(
      userData.password,
      userExist.password,
    );

    if (!isPasswordMatch) {
      throw new AppError(
        "Email and Password Not Match",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = generateToken({
      user_id: userExist.id,
      user_email: userExist.email,
      user_role: userExist.role,
    });

    return token;
  };

  sendActivationCode = async (user: User) => {
    console.log("Send Email to: ", user);
    const contentMail = await renderMailHtml("registration-success.ejs", {
      fullName: user.full_name,
      email: user.email,
      createdAt: user.created_at,
      activationLink: `${CLIENT_HOST}/v1/auth/activation?code=${user.activation_code}`,
    });

    console.log(`Send Email form ${EMAIL_SMTP_USER} to ${user.email}`);
    await sendMail({
      from: EMAIL_SMTP_USER,
      to: user.email,
      subject: "Aktivasi Akun Anda",
      html: contentMail,
    });
  };

  ActivationUser = async (code: string): Promise<User> => {
    const user = await this.userRepository.findUserByActivationCode(code);
    if (!user) {
      throw new AppError("User Not Found", HttpStatus.NOT_FOUND);
    }
    const userdata: Prisma.UserUpdateInput = {
      ...user,
      is_Active: true,
    };
    const updateStatusUser = await this.userRepository.updateUser(
      user.id,
      userdata,
    );
    return updateStatusUser;
  };
}

export const authService = new AuthService(userRepository);
