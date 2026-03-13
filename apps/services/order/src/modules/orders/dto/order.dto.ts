import z from 'zod/v3';

export const PAYMENT_METHODS = ['VA', 'QRIS', 'WALLET'] as const;

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

export const CreateInvoiceDtoSchema = z
  .object({
    idempotensi_Key: z.string().uuid('idempotensi harus berformat uuid'),
    payment_method: z.enum(PAYMENT_METHODS, {
      errorMap: () => ({ message: 'Metode pembayaran harus VA, QRIS, atau WALLET' }),
    }),
    bank_code: z.string().min(1, 'Bank code wajib diisi untuk metode VA').optional(),
    shipping_address: ShippingAddressSchema,
    orders: z.array(StoreOrderSchema).min(1, 'Minimal Checkout 1 toko'),
  })
  .superRefine((data, ctx) => {
    if (data.payment_method === 'VA' && !data.bank_code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bank code wajib diisi jika metode pembayaran adalah VA',
        path: ['bank_code'],
      });
    }
    if (data.payment_method === 'QRIS' && data.bank_code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bank code tidak diperlukan untuk metode pembayaran QRIS',
        path: ['bank_code'],
      });
    }
    if (data.payment_method === 'WALLET' && data.bank_code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bank code tidak diperlukan untuk metode pembayaran WALLET',
        path: ['bank_code'],
      });
    }
  });

export const UpdateOrderSchema = z.object({
  shipping_address: ShippingAddressSchema,
});

export const UpdateInvoiceSchema = z.object({
  shipping_address: ShippingAddressSchema.optional(),
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED']).optional(),
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
export const KAFKA_PAYMENT_TOPIC: string = 'payment.events';

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
    user_id: string;
    customer_name: string;
    total_amount: number;
    order_ids: string[];
    payment_method: string;
    bank_code?: string;
    order_items: {
      product_id: string;
      quantity: number;
      price_at_purchase: number;
    }[];
  };
}

export interface PaymentEventPayload {
  event: 'payment.success' | 'payment.expired' | 'payment.failed';
  timestamp: string;
  data: {
    transaction_id: string;
    invoice_id: string;
    user_id: string;
    amount: number;
    status: string;
  };
}

export interface OrderCancelledEventPayload {
  event: 'order.cancelled';
  timestamp: string;
  data: {
    order_id: string; // Finance
    invoice_id: string; // Finance & Product
    buyer_id: string; // Finance
    user_id: string; // Product (Buyer ID)
    seller_id: string; // Finance
    amount: number; // Finance
    order_ids: string[]; // Product
    order_items: {
      product_id: string;
      quantity: number;
    }[]; // Product
  };
}

export interface OrderCompletedEventPayload {
  event: 'order.completed';
  timestamp: string;
  data: {
    order_id: string;
    invoice_id: string;
    buyer_id: string;
    seller_id: string;
    amount: number;
  };
}

