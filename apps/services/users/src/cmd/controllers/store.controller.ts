import type { NextFunction, Response } from "express";
import { storeService, type StoreService } from "../services/store.service";
import type { IReqUser } from "../../model/user.model";
import response from "../../utils/response";
import type { Prisma } from "../../generated/prisma/client";
import { HttpStatus } from "../../constants/httpStatus";
import { AppError } from "../../utils/appError";
import { log } from "../../lib/logger"; // Import the custom logger

export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  createStore = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.user_id as string;
      console.log(userId)
      if (!userId) {
        log.warn("delivery:http", "Store creation denied: Unauthorized user");
        response.unauthorized(res);
        return; // Ensure the function stops execution here
      }
      const params: Prisma.StoreCreateInput = req.body;
      const store = await this.storeService.createStore(userId, params);

      log.info("delivery:http", "Store created successfully response sent", { store_id: store.id });
      response.success(res, "Store Created", store, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  getStores = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const stores = await this.storeService.findStores();
      if (!stores || stores.length === 0) {
        log.warn("delivery:http", "Stores retrieval: No stores found");
        return response.notFound(res, "Stores Not Found");
      }

      // Silent read on success
      return response.success(
          res,
          "Success Get All Stores",
          stores,
          HttpStatus.OK,
      );
    } catch (error) {
      next(error);
    }
  };

  getStoreById = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const storeId = req.params.id as string;
      if (!storeId) {
        log.warn("delivery:http", "Store retrieval denied: Store ID is missing in params");
        throw new AppError("Store ID is required", HttpStatus.BAD_REQUEST);
      }

      const store = await this.storeService.findStoresById(storeId);
      if (!store) {
        log.warn("delivery:http", "Store retrieval failed: Store not found", { store_id: storeId });
        return response.notFound(res, "Store Not Found");
      }

      // Silent read on success
      return response.success(res, "Success Find Store", store, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  getStoreByOwner = async (
      req: IReqUser,
      res: Response,
      next: NextFunction,
  ) => {
    try {
      const userId = req.user?.user_id as string;
      if (!userId) {
        log.warn("delivery:http", "Store retrieval by owner denied: User ID is missing");
        throw new AppError("User ID is required", HttpStatus.BAD_REQUEST);
      }

      const store = await this.storeService.findStoresByOwnerId(userId);
      if (!store) {
        log.warn("delivery:http", "Store retrieval by owner failed: Store not found", { user_id: userId });
        return response.notFound(res, "Store Not Found");
      }

      // Silent read on success
      return response.success(res, "Success Find Store", store, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  deleteStore = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const storeId = req.params.id as string;
      if (!storeId) {
        log.warn("delivery:http", "Store deletion denied: Store ID is missing in params");
        throw new AppError("Store ID is required", HttpStatus.BAD_REQUEST);
      }

      const store = await this.storeService.deleteStore(storeId);

      log.info("delivery:http", "Store deletion response sent", { store_id: storeId });
      return response.success(
          res,
          "Success Delete Store",
          store,
          HttpStatus.OK,
      );
    } catch (error) {
      next(error);
    }
  };

  updateStore = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const storeId = req.params.id as string;
      if (!storeId) {
        log.warn("delivery:http", "Store update denied: Store ID is missing in params");
        throw new AppError("Store ID is required", HttpStatus.BAD_REQUEST);
      }

      const param: Prisma.StoreUpdateInput = req.body;

      const store = await this.storeService.updateStore(storeId, param);

      log.info("delivery:http", "Store update response sent", { store_id: storeId });
      return response.success(
          res,
          "Success Update Store", // Fixed typo here (was "Success Delate Store")
          store,
          HttpStatus.OK,
      );
    } catch (error) {
      next(error);
    }
  };
}

export const storeController = new StoreController(storeService);