import type { Request } from "express";
import type { User } from "../generated/prisma/client";


export type UserPayload = Omit<User, "password" | "createdAt" | "updatedAt">;

export interface IReqUser extends Request {
  user?: UserJWT;
}

enum USER_ROLE {
  BUYER,
  SELLER,
  ADMIN,
}

export type UserJWT = {
  user_id: string;
  user_email: string;
  user_role: USER_ROLE;
  iat: number;
  exp: number;
};
