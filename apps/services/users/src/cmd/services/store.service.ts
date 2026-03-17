import { HttpStatus } from "../../constants/httpStatus";
import type { Prisma, Store } from "../../generated/prisma/client";
import { AppError } from "../../utils/appError";
import {
  storeRepository,
  type StoreRepository,
} from "../repository/store.repository";
import { log } from "../../lib/logger";
import {userRepository, type UserRepository} from "../repository/user.repository.ts";
import type {UserUpdateInput} from "../../generated/prisma/models/User.ts";
import { redis } from "../../infrastructure/redis";

export class StoreService {
  constructor(private readonly storeRepository: StoreRepository, private readonly userRepository: UserRepository) {}

  createStore = async (
      userId: string,
      storeInput: Prisma.StoreCreateInput,
  ): Promise<Store> => {
    await this.validateCreateStore(userId, storeInput);

    const store = await this.storeRepository.createStore(userId, storeInput);

    const updateUserRole = await this.userRepository.updateUser(userId, {role:"SELLER"} as UserUpdateInput)

    // Invalidate caches
    await redis.del("stores:all");

    log.info("service:store", "Store successfully created", { store_id: store.id, owner_id: userId,owner_role:updateUserRole.role });
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

    // Invalidate caches
    await redis.del(`store:id:${storeId}`);
    await redis.del(`store:owner:${store.user_id}`);
    await redis.del("stores:all");

    log.info("service:store", "Store successfully updated", { store_id: store.id });
    return store;
  };

  // No need to log frequently called read operations
  findStores = async (): Promise<Store[] | null> => {
    const cacheKey = "stores:all";
    const cachedStores = await redis.get(cacheKey);
    if (cachedStores) {
      return JSON.parse(cachedStores);
    }

    const stores = await this.storeRepository.selectStores();
    if (stores) {
      await redis.setex(cacheKey, 300, JSON.stringify(stores));
    }
    return stores;
  };

  findStoresById = async (storeId: string): Promise<Store | null> => {
    const cacheKey = `store:id:${storeId}`;
    const cachedStore = await redis.get(cacheKey);
    if (cachedStore) {
      return JSON.parse(cachedStore);
    }

    const store = await this.storeRepository.selectStoreById(storeId);
    if (store) {
      await redis.setex(cacheKey, 300, JSON.stringify(store));
    }
    return store;
  };

  findStoresByOwnerId = async (ownerId: string): Promise<Store | null> => {
    const cacheKey = `store:owner:${ownerId}`;
    const cachedStore = await redis.get(cacheKey);
    if (cachedStore) {
      return JSON.parse(cachedStore);
    }

    const store = await this.storeRepository.selectStoreByOwnerId(ownerId);
    if (store) {
      await redis.setex(cacheKey, 300, JSON.stringify(store));
    }
    return store;
  };

  deleteStore = async (storeId: string): Promise<Store> => {
    const existStore = await this.storeRepository.selectStoreById(storeId);
    if (!existStore) {
      log.warn("service:store", "Store deletion failed: Store not found", { store_id: storeId });
      throw new AppError("Store Is Not Exist", HttpStatus.BAD_REQUEST);
    }

    const deletedStore = await this.storeRepository.deleteStore(storeId);

    // Invalidate caches
    await redis.del(`store:id:${storeId}`);
    await redis.del(`store:owner:${deletedStore.user_id}`);
    await redis.del("stores:all");

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

export const storeService = new StoreService(storeRepository,userRepository);