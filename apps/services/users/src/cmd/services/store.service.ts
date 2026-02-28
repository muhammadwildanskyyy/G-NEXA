import { HttpStatus } from "../../constants/httpStatus";
import type { Prisma, Store } from "../../generated/prisma/client";
import { AppError } from "../../utils/appError";
import {
  storeRepository,
  type StoreRepository,
} from "../repository/store.repository";
import { log } from "../../lib/logger"; // Import the custom logger

export class StoreService {
  constructor(private readonly storeRepository: StoreRepository) {}

  createStore = async (
      userId: string,
      storeInput: Prisma.StoreCreateInput,
  ): Promise<Store> => {
    await this.validateCreateStore(userId, storeInput);

    const store = await this.storeRepository.createStore(userId, storeInput);

    log.info("service:store", "Store successfully created", { store_id: store.id, owner_id: userId });
    return store;
  };

  updateStore = async (
      storeId: string,
      storeInput: Prisma.StoreUpdateInput,
  ): Promise<Store> => {
    const existStore = await this.storeRepository.selectStoreById(storeId);
    if (!existStore) {
      log.warn("service:store", "Store update failed: Store not found", { store_id: storeId });
      throw new AppError("Store Is Not Exist", HttpStatus.BAD_REQUEST);
    }

    const store = await this.storeRepository.updateStore(storeId, storeInput);
    if (!store) {
      log.error("service:store", "System failed to update store", undefined, { store_id: storeId });
      throw new AppError(
          "Update Store Failed",
          HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    log.info("service:store", "Store successfully updated", { store_id: store.id });
    return store;
  };

  // No need to log frequently called read operations
  findStores = async (): Promise<Store[] | null> => {
    return await this.storeRepository.selectStores();
  };

  findStoresById = async (storeId: string): Promise<Store | null> => {
    return await this.storeRepository.selectStoreById(storeId);
  };

  findStoresByOwnerId = async (ownerId: string): Promise<Store | null> => {
    return await this.storeRepository.selectStoreByOwnerId(ownerId);
  };

  deleteStore = async (storeId: string): Promise<Store> => {
    const existStore = await this.storeRepository.selectStoreById(storeId);
    if (!existStore) {
      log.warn("service:store", "Store deletion failed: Store not found", { store_id: storeId });
      throw new AppError("Store Is Not Exist", HttpStatus.BAD_REQUEST);
    }

    const deletedStore = await this.storeRepository.deleteStore(storeId);
    log.info("service:store", "Store successfully deleted", { store_id: storeId });

    return deletedStore;
  };

  validateCreateStore = async (
      userId: string,
      storeInput: Prisma.StoreCreateInput,
  ): Promise<void> => {
    const isHaveStore = await this.storeRepository.selectStoreByOwnerId(userId);
    if (isHaveStore) {
      log.warn("service:store", "Store creation failed: User already has a store", { user_id: userId });
      throw new AppError("This user already have store", HttpStatus.CONFLICT);
    }

    const existStore = await this.storeRepository.selectStoreByName(
        storeInput.name,
    );
    if (existStore) {
      log.warn("service:store", "Store creation failed: Store name already exists", { store_name: storeInput.name });
      throw new AppError("Store Name Already Exist", HttpStatus.BAD_REQUEST);
    }

    return;
  };
}

export const storeService = new StoreService(storeRepository);