import type { NextFunction, Request, Response } from "express";
import response from "../utils/response";
import { verifyToken } from "../lib/jwt";
import type { IReqUser, UserJWT } from "../model/user.model";
import { log } from "../lib/logger"; // Import the custom logger

export default (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers?.authorization;
  if (!authorization) {
    log.warn("middleware:auth", "Authentication denied: Missing authorization header");
    return response.unauthorized(res);
  }

  const [prefix, rawToken] = authorization.split(" ");
  const accessToken = rawToken?.replace(/[^\w\-\.]/g, "");

  if (!(prefix === "Bearer" && accessToken)) {
    log.warn("middleware:auth", "Authentication denied: Invalid token format");
    return response.unauthorized(res);
  }

  const decoded = verifyToken(accessToken);

  if (!decoded) {
    log.warn("middleware:auth", "Authentication denied: Invalid or expired token");
    return response.unauthorized(res);
  }

  (req as IReqUser).user = decoded as UserJWT;

  // Silent success to prevent log spamming on every protected route
  next();
};