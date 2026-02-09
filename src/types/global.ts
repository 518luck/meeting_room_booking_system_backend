import { Permission } from '@/user/entities/permission.entity';

export interface JwtUserData {
  picture?: string;
  lastName?: string;
  firstName?: string;
  userId: number;
  username: string;
  email: string;
  roles: string[];
  permissions: Permission[];
}

declare module 'express' {
  interface Request {
    user: JwtUserData;
  }
}
