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
import { KAFKA_TOPIC_USER, publishEvent, type UserEventPayload } from "../../infrastructure/kafka/producer";
import { log } from "../../lib/logger";

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  register = async (user: Prisma.UserCreateInput): Promise<User> => {
    const userExist = await this.userRepository.findByEmail(user.email);
    const existUserPhone = await this.userRepository.findByPhone(user.phone_number);
    if (userExist) {
      log.warn("service:auth", "Registration failed: Email already registered", { email: user.email });
      throw new AppError(
          "This Email Already Registered",
          HttpStatus.BAD_REQUEST,
      );
    }
    if (existUserPhone ) {
      log.warn("service:auth", "Registration failed: Email already registered", { email: user.email });
      throw new AppError(
          "This Phone Number Already Registered",
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

    log.info("service:auth", "New user successfully registered", { user_id: UserCreate.id });
    this.sendActivationCode(UserCreate);

    return UserCreate;
  };

  login = async (userData: TUserLogin): Promise<string> => {
    const userExist = await this.userRepository.findByEmail(userData.email);
    if (!userExist) {
      log.warn("service:auth", "Login failed: Email not registered", { email: userData.email });
      throw new AppError("Email Not Registered", HttpStatus.UNAUTHORIZED);
    }

    if(!userExist.is_Active){
      log.warn("service:auth", "Login failed: User Not Active", { email: userData.email });
      throw new AppError("User Not Active", HttpStatus.UNAUTHORIZED);
    }

    const isPasswordMatch = await PasswordHelper.compare(
        userData.password,
        userExist.password,
    );

    if (!isPasswordMatch) {
      log.warn("service:auth", "Login failed: Incorrect password", { email: userData.email });
      throw new AppError(
          "Email and Password Not Match",
          HttpStatus.UNAUTHORIZED,
      );
    }

    if (!userExist.is_Active) {
      log.warn("service:auth", "Login failed: Account not active", { user_id: userExist.id });
      throw new AppError("User Not Active", HttpStatus.CONFLICT);
    }

    log.info("service:auth", "User successfully logged in", { user_id: userExist.id });
    const token = generateToken({
      user_id: userExist.id,
      user_email: userExist.email,
      user_role: userExist.role,
    });

    return token;
  };

  sendActivationCode = async (user: User) => {
    const contentMail = await renderMailHtml("registration-success.ejs", {
      fullName: user.full_name,
      email: user.email,
      createdAt: user.created_at,
      activationLink: `${CLIENT_HOST}/v1/auth/activation?code=${user.activation_code}`,
    });

    log.info("infra:mail", "Sending activation email...", { to: user.email });

    try {
      await sendMail({
        from: EMAIL_SMTP_USER,
        to: user.email,
        subject: "Aktivasi Akun Anda", // You can translate the email subject to English if needed
        html: contentMail,
      });
    } catch (error) {
      log.error("infra:mail", "Failed to send activation email", error, { email: user.email });
    }
  };

  ActivationUser = async (code: string): Promise<User> => {
    const user = await this.userRepository.findUserByActivationCode(code);
    if (!user) {
      log.warn("service:auth", "Activation failed: Invalid code");
      throw new AppError("User Not Found", HttpStatus.NOT_FOUND);
    }

    if(user.is_Active){
      return user;
    }

    const userdata: Prisma.UserUpdateInput = {
      ...user,
      is_Active: true,
    };

    const updateStatusUser = await this.userRepository.updateUser(
        user.id,
        userdata,
    );

    const eventPayload: UserEventPayload = {
      event: "user.created",
      timestamp: new Date().toISOString(),
      data: {
        user_id: updateStatusUser.id,
        email: updateStatusUser.email,
        name: updateStatusUser.full_name,
      },
    };

    log.info("infra:kafka", "Publishing user.created event", { user_id: updateStatusUser.id });

    publishEvent(
        KAFKA_TOPIC_USER,
        updateStatusUser.id,
        eventPayload
    );

    log.info("service:auth", "Account successfully activated", { user_id: updateStatusUser.id });
    return updateStatusUser;
  };
}

export const authService = new AuthService(userRepository);