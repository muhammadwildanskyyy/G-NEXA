import z from 'zod/v3';

export const UpsertCartItemSchema = z.object({
  product_id: z.string(),
  store_id: z.string(),
  quantity_to_add: z
    .number()
    .min(-1, 'quantity must be more then -1')
    .max(1, 'max quantity is 1'),
});

export type UpsertCartItemsDto = z.infer<typeof UpsertCartItemSchema>;
