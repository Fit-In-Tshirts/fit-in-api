import { PrismaClient, Prisma } from "../generated/prisma";

const prisma = new PrismaClient();

export async function main() {
  // Create default roles with predefined UUIDs for consistency across environments
  const roles = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001', // Predefined UUID for customer role
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
      id: '550e8400-e29b-41d4-a716-446655440002', // Predefined UUID for admin role
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
      id: '550e8400-e29b-41d4-a716-446655440003', // Predefined UUID for superAdmin role
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
  ];

  console.log('Seeding roles...');
  
  for (const role of roles) {
    const upsertedRole = await prisma.role.upsert({
      where: { id: role.id },
      update: {
        // Update permissions and description in case they changed
        permissions: role.permissions,
        description: role.description,
      },
      create: role
    });
    
    console.log(`✅ Role "${upsertedRole.name}" seeded successfully`);
  }
  
  console.log('🌱 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });