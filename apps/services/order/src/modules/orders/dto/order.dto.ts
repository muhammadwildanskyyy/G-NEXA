import z from 'zod/v3';

export const ShippingAddressSchema = z.object({
  recipient_name: z.string().min(3, 'Nama penerima minimal 3 karakter'),
  phone_number: z.string().min(9, 'Nomor telepon tidak valid'),
  full_address: z.string().min(10, 'Alamat lengkap terlalu pendek'),
  city: z.string().min(3, 'Kota wajib diisi'),
  province: z.string().min(3, 'Provinsi wajib diisi'),
  postal_code: z.string().min(5, 'Kode pos wajib diisi'),
});

export const OrderItemSchema = z.object({
  product_id: z.string().min(1, 'Product ID wajib diisi'),
  quantity: z.number().int().positive('Kuantitas harus lebih dari 0'),
});

export const StoreOrderSchema = z.object({
  store_id: z.string().uuid('Store ID harus berupa format UUID'),
  items: z.array(OrderItemSchema).min(1, 'Berisikan minimal 1 order item'),
});

export const CreateInvoiceDtoSchema = z.object({
  idempotensi_Key: z.string().uuid('idempotensi harus berformat uuid'),
  shipping_address: ShippingAddressSchema,
  orders: z.array(StoreOrderSchema).min(1, 'Minimal Checkout 1 toko'),
});

export const UpdateOrderSchema = z.object({
  shipping_address: ShippingAddressSchema,
});

export const UpdateInvoiceSchema = z.object({
  shipping_address: ShippingAddressSchema.optional(),
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'CANCELLED']).optional(),
});

export type StoreOrderDto = z.infer<typeof StoreOrderSchema>;
export type CreateInvoiceDto = z.infer<typeof CreateInvoiceDtoSchema>;
export type UpdateOrderDto = z.infer<typeof UpdateOrderSchema>;
export type UpdateInvoiceDto = z.infer<typeof UpdateInvoiceSchema>;
export class GlobalOrderResponse<T> {
  meta: {
    message: string;
    code: number;
  };
  data: T;
}

export const KAFKA_ORDER_TOPIC: string = 'order.events';
export interface OrderEventPayload {
  event: 'order.update';
  timestamp: string;
  data: any;
}

export interface InvoiceEventPayload {
  event: 'invoice.created';
  timestamp: string;
  data: {
    invoice_id: string;
    total_amount: number;
    order_ids: string[];
  };
}
