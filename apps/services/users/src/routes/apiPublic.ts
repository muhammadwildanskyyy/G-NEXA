import express from "express";
import authController from "../controllers/auth.controller";
const routerPublic = express.Router();

routerPublic.post("/register", authController.register);
routerPublic.get("/login", authController.login);

export default routerPublic;
