import type { NextFunction, Request, Response } from "express";
import response from "../utils/response";
import { verifyToken } from "../lib/jwt";
import type { IReqUser, UserJWT, UserPayload } from "../model/user.model";

export default (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers?.authorization;
  if (!authorization) return response.unauthorized(res);

  const [prefix, rawToken] = authorization.split(" ");
  const accessToken = rawToken?.replace(/[^\w\-\.]/g, "");

  if (!(prefix === "Bearer" && accessToken)) {
    return response.unauthorized(res);
  }

  const decoded = verifyToken(accessToken);

  if (!decoded) {
    return response.unauthorized(res);
  }

  (req as IReqUser).user = decoded as UserJWT;

  next();
};
