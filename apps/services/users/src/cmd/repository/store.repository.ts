import type {
  Prisma,
  PrismaClient,
  Store,
} from "../../generated/prisma/client";
import { database } from "../../lib/database";

export class StoreRepository {
  constructor(private readonly database: PrismaClient) {}

  createStore = async (
    userId: string,
    inputStore: Prisma.StoreCreateInput,
  ): Promise<Store> => {
    return await this.database.store.create({
      data: {
        ...inputStore,
        user: {
          connect: { id: userId },
        },
      },
    });
  };

  updateStore = async (
    storeId: string,
    inputStore: Prisma.StoreUpdateInput,
  ): Promise<Store | null> => {
    return await this.database.store.update({
      where: { id: storeId },
      data: inputStore,
    });
  };

  selectStores = async (): Promise<Store[] | null> => {
    return await this.database.store.findMany();
  };

  selectStoreById = async (storeId: string): Promise<Store | null> => {
    return await this.database.store.findUnique({ where: { id: storeId } });
  };

  selectStoreByName = async (storeName: string): Promise<Store | null> => {
    return await this.database.store.findUnique({ where: { name: storeName } });
  };

  selectStoreByOwnerId = async (ownerId: string): Promise<Store | null> => {
    return await this.database.store.findUnique({
      where: { user_id: ownerId },
    });
  };

  deleteStore = async (storeId: string): Promise<Store> => {
    return await this.database.store.delete({ where: { id: storeId } });
  };
}

export const storeRepository = new StoreRepository(database);
