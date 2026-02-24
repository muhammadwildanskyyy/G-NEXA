import type { NextFunction, Response } from "express";
import { storeService, type StoreService } from "../services/store.service";
import type { IReqUser } from "../../model/user.model";
import response from "../../utils/response";
import type { Prisma } from "../../generated/prisma/client";
import { logger } from "../../lib/logger";
import { HttpStatus } from "../../constants/httpStatus";
import { AppError } from "../../utils/appError";

export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  createStore = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.user_id as string;
      if (!userId) {
        response.unauthorized(res);
      }
      const params: Prisma.StoreCreateInput = req.body;
      const store = await this.storeService.createStore(userId, params);
      logger.info("Store Create", {
        userId: store.user_id,
        storeId: store.id,
      });
      response.success(res, "Store Created", store, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  getStores = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const stores = await this.storeService.findStores();
      if (!stores) {
        logger.warn("Stores Not Found");
        return response.notFound(res, "Stores Not Found");
      }
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
        throw new AppError("Store ID is required", HttpStatus.BAD_REQUEST);
      }

      const store = await this.storeService.findStoresById(storeId);
      if (!store) {
        logger.warn("Stores Not Found");
        return response.notFound(res, "Stores Not Found");
      }

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
        throw new AppError("Store ID is required", HttpStatus.BAD_REQUEST);
      }

      const store = await this.storeService.findStoresByOwnerId(userId);
      if (!store) {
        logger.warn("Stores Not Found");
        return response.notFound(res, "Stores Not Found");
      }

      return response.success(res, "Success Find Store", store, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  };

  deleteStore = async (req: IReqUser, res: Response, next: NextFunction) => {
    try {
      const storeId = req.params.id as string;
      if (!storeId) {
        throw new AppError("Store ID is required", HttpStatus.BAD_REQUEST);
      }

      const store = await this.storeService.deleteStore(storeId);

      return response.success(
        res,
        "Success Delate Store",
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
        throw new AppError("Store ID is required", HttpStatus.BAD_REQUEST);
      }

      const param: Prisma.StoreUpdateInput = req.body;

      const store = await this.storeService.updateStore(storeId, param);

      return response.success(
        res,
        "Success Delate Store",
        store,
        HttpStatus.OK,
      );
    } catch (error) {
      next(error);
    }
  };
}

export const storeController = new StoreController(storeService);
