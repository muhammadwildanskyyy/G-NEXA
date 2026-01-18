import * as z from "zod";

const RoleEnum = z.enum(["BUYER", "SELLER", "ADMIN"]);

export const userRegisterSchema = z.object({
  fullName: z
    .string()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  email: z
    .string()
    .email("Format email tidak valid")
    .max(150, "Email terlalu panjang"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung setidaknya satu huruf kapital")
    .regex(/[0-9]/, "Password harus mengandung setidaknya satu angka"),
  role: RoleEnum.default("BUYER"),
  phoneNumber: z
    .string()
    .regex(
      /^(\+62|0)8[1-9][0-9]{6,10}$/,
      "Format nomor telepon Indonesia tidak valid",
    )
    .optional()
    .nullable(),
  profilePicture: z
    .string()
    .url("Format URL foto profil tidak valid")
    .optional()
    .nullable(),
  bio: z.string().max(255, "Bio maksimal 255 karakter").optional().nullable(),
});

export const userLoginSchema = z.object({
  email: z.string(),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung setidaknya satu huruf kapital")
    .regex(/[0-9]/, "Password harus mengandung setidaknya satu angka"),
});

export type UserLogin = z.infer<typeof userLoginSchema>;
