import express from "express";
import authMiddleware from "../middlewares/auth.middleware";
import authController from "../controllers/auth.controller";
import userController from "../controllers/user.controller";
const routerPrivate = express.Router();
routerPrivate.use(authMiddleware);

routerPrivate.get("/users/me", authController.me);
routerPrivate.put("/users/update-user", userController.updateUser);

export default routerPrivate;
