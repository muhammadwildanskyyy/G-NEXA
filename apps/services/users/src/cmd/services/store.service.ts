import { HttpStatus } from "../../constants/httpStatus";
import type { Prisma, Store } from "../../generated/prisma/client";
import { AppError } from "../../utils/appError";
import {
  storeRepository,
  type StoreRepository,
} from "../repository/store.repository";

export class StoreService {
  constructor(private readonly storeRepository: StoreRepository) {}

  createStore = async (
    userId: string,
    storeInput: Prisma.StoreCreateInput,
  ): Promise<Store> => {
    await this.validateCreateStore(userId, storeInput);

    return await this.storeRepository.createStore(userId, storeInput);
  };

  updateStore = async (
    storeId: string,
    storeInput: Prisma.StoreUpdateInput,
  ): Promise<Store> => {
    const existStore = await this.storeRepository.selectStoreById(storeId);
    if (!existStore) {
      throw new AppError("Store Is Not Exist", HttpStatus.BAD_REQUEST);
    }

    const store = await this.storeRepository.updateStore(storeId, storeInput);
    if (!store) {
      throw new AppError(
        "Update Store Failed",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return store;
  };

  findStores = async (): Promise<Store[] | null> => {
    return await this.storeRepository.selectStores();
  };

  findStoresById = async (storeId: string): Promise<Store | null> => {
    return await this.storeRepository.selectStoreById(storeId);
  };

  deleteStore = async (storeId: string): Promise<Store> => {
    const existStore = await this.storeRepository.selectStoreById(storeId);
    if (!existStore) {
      throw new AppError("Store Is Not Exist", HttpStatus.BAD_REQUEST);
    }
    return await this.storeRepository.deleteStore(storeId);
  };

  validateCreateStore = async (
    userId: string,
    storeInput: Prisma.StoreCreateInput,
  ): Promise<void> => {
    const isHaveStore = await this.storeRepository.selectStoreByOwnerId(userId);
    if (isHaveStore) {
      throw new AppError("This user already have store", HttpStatus.CONFLICT);
    }

    const existStore = await this.storeRepository.selectStoreByName(
      storeInput.name,
    );
    if (existStore) {
      throw new AppError("Store Name Already Exist", HttpStatus.BAD_REQUEST);
    }

    return;
  };
}

export const storeService = new StoreService(storeRepository);
