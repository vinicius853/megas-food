import { Prisma, UserRole } from '@prisma/client';

export const commercialTenantWhere = {
  users: {
    some: {
      role: UserRole.CLIENT_OWNER,
    },
  },
} satisfies Prisma.TenantWhereInput;

export function withCommercialTenant(
  where: Prisma.TenantWhereInput = {},
): Prisma.TenantWhereInput {
  return {
    AND: [where, commercialTenantWhere],
  };
}
