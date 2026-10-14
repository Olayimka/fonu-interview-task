import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (Role | 'admin' | 'customer' | 'ADMIN' | 'CUSTOMER')[]) =>
  SetMetadata(
    ROLES_KEY,
    roles.map((r) => (typeof r === 'string' ? (r.toUpperCase() as Role) : r)),
  );
