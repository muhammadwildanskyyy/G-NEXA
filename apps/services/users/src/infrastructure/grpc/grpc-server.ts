import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { userService } from "../../cmd/services/user.service";
import { storeService } from "../../cmd/services/store.service";
import { log } from "../../lib/logger";
import { ReflectionService } from "@grpc/reflection";

const PROTO_PATH = path.resolve(__dirname, "../../../proto/user.proto");

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef) as any;

// ─── Handler Implementations ───

async function getUser(
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
) {
  try {
    const { userId } = call.request;
    if (!userId) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "user_id is required",
      });
    }

    const user = await userService.getUserById(userId);

    callback(null, {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      isActive: user.is_Active,
      phoneNumber: user.phone_number,
      profilePicture: user.profile_picture ?? "",
      bio: user.bio ?? "",
      createdAt: { seconds: Math.floor(user.created_at.getTime() / 1000), nanos: 0 },
      updatedAt: { seconds: Math.floor(user.updated_at.getTime() / 1000), nanos: 0 },
    });
  } catch (error: any) {
    log.error("grpc:user", "GetUser failed", error);
    callback({
      code: grpc.status.NOT_FOUND,
      message: error.message || "User not found",
    });
  }
}

async function getStoreById(
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
) {
  try {
    const { storeId } = call.request;
    if (!storeId) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "store_id is required",
      });
    }

    const store = await storeService.findStoresById(storeId);
    if (!store) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Store not found",
      });
    }

    callback(null, mapStoreToProto(store));
  } catch (error: any) {
    log.error("grpc:user", "GetStoreById failed", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message || "Internal server error",
    });
  }
}

async function getStoreByOwner(
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
) {
  try {
    const { ownerId } = call.request;
    if (!ownerId) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "owner_id is required",
      });
    }

    const store = await storeService.findStoresByOwnerId(ownerId);
    if (!store) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Store not found",
      });
    }

    callback(null, mapStoreToProto(store));
  } catch (error: any) {
    log.error("grpc:user", "GetStoreByOwner failed", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message || "Internal server error",
    });
  }
}

// ─── Helper ───

function mapStoreToProto(store: any) {
  return {
    id: store.id,
    name: store.name,
    description: store.description ?? "",
    status: store.status,
    isVerified: store.is_verified,
    logoUrl: store.logo_url ?? "",
    coverUrl: store.cover_url ?? "",
    address: store.address ?? "",
    city: store.city ?? "",
    province: store.province ?? "",
    postalCode: store.postal_code ?? "",
    latitude: store.latitude ?? 0,
    longitude: store.longitude ?? 0,
    userId: store.user_id,
    createdAt: { seconds: Math.floor(new Date(store.created_at).getTime() / 1000), nanos: 0 },
    updatedAt: { seconds: Math.floor(new Date(store.updated_at).getTime() / 1000), nanos: 0 },
  };
}

// ─── Server Bootstrap ───

export function startGrpcServer(): void {
  const port = process.env.GRPC_PORT || "50052";

  const server = new grpc.Server();

  server.addService(proto.users.UserService.service, {
    getUser,
    getStoreById,
    getStoreByOwner,
  });

  const reflection = new ReflectionService(packageDef);
  reflection.addToServer(server);

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        log.error("grpc:bootstrap", "Failed to start gRPC server", err);
        return;
      }
      log.info("grpc:bootstrap", `gRPC server running on port ${boundPort}`);
    },
  );
}
