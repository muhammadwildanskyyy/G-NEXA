import { USER_ROLE } from '../../../../common/guards/auth/auth.guard';

export class GlobalUserResponse<T> {
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

export class User {
  id: string;
  full_name: string;
  email: string;
  password: string;
  role: USER_ROLE;
  phone_number?: string;
  profile_picture?: string;
  bio?: string;
  created_at: Date;
  updated_at: Date;
}
