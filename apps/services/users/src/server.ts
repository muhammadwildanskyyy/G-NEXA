import app from "./app";
import { connectDB } from "./lib/database";
import {log} from "./lib/logger";
import {connectConsumer, disconnectConsumer} from "./infrastructure/kafka/consumer.ts";
import {connectProducer, disconnectProducer} from "./infrastructure/kafka/producer.ts"; // Opsional: gunakan logger kamu daripada console.log
import { startGrpcServer } from "./infrastructure/grpc/grpc-server";

async function bootstrap() {
  try {
    const PORT = process.env.PORT ;

    await connectProducer();
    await connectConsumer();

    // 1. Hubungkan Database
    await connectDB();

    // 2. Start gRPC Server
    startGrpcServer();
    const server = app.listen(PORT, () => log.info("APP",`Server Running on localhost:${PORT}`,));

    const shutdown = async () => {
      log.info("APP","APP SHUTDOWN");
      server.close();
      await disconnectProducer();
      await disconnectConsumer();
      process.exit(0);
    };

    process.on("SIGTERM", shutdown); // Trigger dari Docker/K8s
    process.on("SIGINT", shutdown);
  } catch (error) {

    log.error("APP","Critical error during server startup",error);
    process.exit(1);
  }
}

bootstrap();
