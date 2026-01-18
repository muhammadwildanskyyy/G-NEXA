import express from "express";
import authMiddleware from "../middlewares/auth.middleware";
import authController from "../controllers/auth.controller";
const routerPrivate = express.Router();
routerPrivate.use(authMiddleware);

routerPrivate.get("/me", authController.me);

export default routerPrivate;
