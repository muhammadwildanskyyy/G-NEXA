import express from "express";
import { authController } from "../cmd/controllers/auth.controller";
import { validateRequest } from "../middlewares/validateRequest";
import {
  userLoginSchema,
  userRegisterSchema,
} from "../validation/user.validation";
import {userController} from "../cmd/controllers/user.controller.ts";
import routerPrivate from "./apiPrivate.ts";

const routerPublic = express.Router();

routerPublic.post(
  "/auth/register",
  validateRequest(userRegisterSchema),
  authController.register,
);
routerPublic.post(
  "/auth/login",
  validateRequest(userLoginSchema),
  authController.login,
);
routerPublic.get("/auth/send-activation", authController.getVerificationCode);
routerPublic.get("/auth/activation", authController.activationUser);
routerPublic.get("/activation", authController.activationUser);

export default routerPublic;
