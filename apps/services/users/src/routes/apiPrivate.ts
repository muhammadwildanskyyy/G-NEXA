import express from "express";
import authMiddleware from "../middlewares/auth.middleware";
import authController from "../controllers/auth.controller";
import userController from "../controllers/user.controller";
const routerPrivate = express.Router();
routerPrivate.use(authMiddleware);

routerPrivate.get("/me", authController.me);
routerPrivate.put("/update-user", userController.updateUser);

export default routerPrivate;
