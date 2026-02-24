export enum StoreStatus {
  ACTIVE,
  INACTIVE,
  BANNED,
  MAINTENANCE,
}

export class Store {
  id: string;
  name: string;
  description: string;
  status: StoreStatus;
  is_verified: boolean;

  // Visuals
  logo_url: string;
  cover_url: string;

  // Location
  address: string;
  city: string;
  province: string;
  postal_code: string;
  latitude: number;
  longitude: number;

  user_id: string;
  created_at: Date;
  updated_at: Date;
}
