import express from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { authController } from "../cmd/controllers/auth.controller";
import { userController } from "../cmd/controllers/user.controller";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createStoreSchema,
  updateStoreSchema,
} from "../validation/store.validation";
import { storeController } from "../cmd/controllers/store.controller";

const routerPrivate = express.Router();
routerPrivate.use(authMiddleware);

routerPrivate.get("/me", authController.me);
routerPrivate.put("/update-user", userController.updateUser);
routerPrivate.get("/activation-code", userController.updateUser);

routerPrivate.post(
  "/store/register",
  validateRequest(createStoreSchema),
  storeController.createStore,
);
routerPrivate.get("/store", storeController.getStores);
routerPrivate.get("/store/owner", storeController.getStoreByOwner);
routerPrivate.get("/store/:id", storeController.getStoreById);
routerPrivate.put(
  "/store/:id",
  validateRequest(updateStoreSchema),
  storeController.updateStore,
);
routerPrivate.delete("/store/:id", storeController.deleteStore);

export default routerPrivate;
