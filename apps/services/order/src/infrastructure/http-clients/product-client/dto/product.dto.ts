export class GlobalProductResponse<T> {
  meta: {
    message: string;
    code: number;
  };
  data: T;
}

export class Dimensions {
  length!: number;
  width!: number;
  height!: number;
}

export class Product {
  id!: string;
  store_id!: string;
  category_id!: string ;
  // --- Basic Info ---
  name!: string;
  slug?: string;
  description!: string;
  condition!: string;

  // --- Pricing & Inventory ---
  price!: number;
  stock!: number;
  is_active!: boolean;

  // --- Shipping Info ---
  weight!: number;
  dimensions!: Dimensions;

  // --- Visuals ---
  images!: string[];
  thumbnail!: string;

  // --- Dynamic Part ---
  specs!: Record<string, unknown>;


  // --- Metadata ---
  tags?: string[];
  views?: number;
  rating?: number;
  created_at?: Date;
  updated_at?: Date;
}

export class ErrProductResponse extends GlobalProductResponse<null> {}
export class GetProductInfoResponse extends GlobalProductResponse<Product> {}
