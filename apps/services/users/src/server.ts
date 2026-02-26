import app from "./app";
import { connectDB } from "./lib/database";
import { logger } from "./lib/logger";
import {connectConsumer, disconnectConsumer} from "./infrastructure/kafka/consumer.ts";
import {connectProducer, disconnectProducer} from "./infrastructure/kafka/producer.ts"; // Opsional: gunakan logger kamu daripada console.log

async function bootstrap() {
  try {
    const PORT = process.env.PORT ;

    await connectProducer();
    await connectConsumer();

    // 1. Hubungkan Database
    await connectDB();
    console.log("Database connected successfully");

    // 2. Jalankan Server
    const server = app.listen(PORT, () => logger.info("Server running"));

    const shutdown = async () => {
      logger.info("Shutting down gracefully...");
      server.close();
      await disconnectProducer();
      await disconnectConsumer();
      process.exit(0);
    };

    process.on("SIGTERM", shutdown); // Trigger dari Docker/K8s
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Critical error during server startup:", error);
    process.exit(1);
  }
}

bootstrap();
