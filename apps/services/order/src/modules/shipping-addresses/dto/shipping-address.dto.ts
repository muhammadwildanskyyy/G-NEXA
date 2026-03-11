import z from 'zod/v3';

export const CreateShippingAddressSchema = z.object({
  recipient_name: z.string().min(3, 'Nama penerima minimal 3 karakter').max(100),
  phone_number: z.string().min(9, 'Nomor telepon minimal 9 karakter').max(20),
  full_address: z.string().min(10, 'Alamat lengkap terlalu pendek'),
  city: z.string().min(3, 'Kota wajib diisi').max(100),
  province: z.string().min(3, 'Provinsi wajib diisi').max(100),
  postal_code: z.string().min(5, 'Kode pos wajib diisi').max(20),
  is_primary: z.boolean().optional().default(false),
});

export const UpdateShippingAddressSchema = CreateShippingAddressSchema.partial();

export type CreateShippingAddressDto = z.infer<typeof CreateShippingAddressSchema>;
export type UpdateShippingAddressDto = z.infer<typeof UpdateShippingAddressSchema>;

export class GlobalShippingAddressResponse<T> {
  meta: {
    message: string;
    code: number;
  };
  data: T;
}
