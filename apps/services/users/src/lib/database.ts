import { PrismaClient } from "../generated/prisma/client";

/**
 * Mendefinisikan tipe global untuk menyimpan instance Prisma.
 * Ini mencegah pembuatan instance baru setiap kali file di-reload oleh Bun.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    // Konfigurasi Logging:
    // Menampilkan query di console saat development untuk memudahkan debugging
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

// Mengambil instance dari global jika sudah ada, atau buat baru jika belum
export const database = globalThis.prismaGlobal ?? prismaClientSingleton();

// Simpan ke global scope jika tidak di environment production
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = database;
}

/**
 * Helper function untuk mengecek koneksi database saat startup
 */
export const connectDB = async () => {
  try {
    await database.$connect();
    console.info("🐘 Database connected successfully to PostgreSQL");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
    process.exit(1); // Hentikan service jika DB tidak terkoneksi
  }
};
