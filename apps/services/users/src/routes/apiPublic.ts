import express from "express";
import authController from "../controllers/auth.controller";
const routerPublic = express.Router();

routerPublic.post("/auth/register", authController.register);
routerPublic.post("/auth/login", authController.login);

export default routerPublic;