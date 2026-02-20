import { z } from "zod";

// 1. Enum Status (Pastikan ini sesuai dengan enum di Prisma kamu)
export const StoreStatus = z.enum([
  "ACTIVE",
  "INACTIVE",
  "BANNED",
  "MAINTENANCE",
]);

export const createStoreSchema = z.object({
  // Identitas Dasar
  name: z
    .string()
    .min(3, "Nama toko minimal 3 karakter")
    .max(50, "Nama toko maksimal 50 karakter"),
  description: z
    .string()
    .max(1000, "Deskripsi jangan terlalu panjang")
    .optional()
    .nullable(),

  // Aset Visual
  logo_url: z.string().url("Format logo URL tidak valid").optional().nullable(),
  cover_url: z
    .string()
    .url("Format cover URL tidak valid")
    .optional()
    .nullable(),

  // Lokasi & Logistik
  address: z.string().min(5, "Alamat terlalu pendek").optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postal_code: z
    .string()
    .regex(/^[0-9]{5}$/, "Kode pos harus 5 angka")
    .optional()
    .nullable(),

  // Koordinat
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

// 2. Schema untuk Update
export const updateStoreSchema = createStoreSchema.partial();
