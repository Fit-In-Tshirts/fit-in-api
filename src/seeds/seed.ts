import { PrismaClient, Prisma } from "../generated/prisma";
const prisma = new PrismaClient();

export async function main() {
  // Create default roles
  const roles = [
    {
      id: 1,
      name: 'customer',
      description: 'Regular customer with basic access',
      permissions: {
        canViewProfile: true,
        canEditProfile: true,
        canPlaceOrders: true,
        canViewOrders: true
      }
    },
    {
      id: 2,
      name: 'admin',
      description: 'Administrator with elevated access',
      permissions: {
        canViewProfile: true,
        canEditProfile: true,
        canPlaceOrders: true,
        canViewOrders: true,
        canManageUsers: true,
        canViewReports: true,
        canManageProducts: true
      }
    },
    {
      id: 3,
      name: 'superAdmin',
      description: 'Super administrator with full system access',
      permissions: {
        canViewProfile: true,
        canEditProfile: true,
        canPlaceOrders: true,
        canViewOrders: true,
        canManageUsers: true,
        canViewReports: true,
        canManageProducts: true,
        canManageRoles: true,
        canManageSystem: true,
        canDeleteUsers: true
      }
    }
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: role
    })
  }

  console.log('Roles seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })