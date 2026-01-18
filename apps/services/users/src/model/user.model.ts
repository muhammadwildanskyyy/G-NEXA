import type { Request } from "express";
import type { User } from "../generated/prisma/client";

export type UserPayload = Omit<User, "password" | "createdAt" | "updatedAt">;

export interface IReqUser extends Request {
  user?: UserPayload;
}
