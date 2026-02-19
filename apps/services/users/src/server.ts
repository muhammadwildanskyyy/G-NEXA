import app from "./app";
import { connectDB } from "./lib/database";
import { logger } from "./lib/logger"; // Opsional: gunakan logger kamu daripada console.log

async function bootstrap() {
  try {
    const PORT = process.env.PORT || 3000;

    // 1. Hubungkan Database
    await connectDB();
    console.log("Database connected successfully");

    // 2. Jalankan Server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Critical error during server startup:", error);
    process.exit(1);
  }
}

bootstrap();
