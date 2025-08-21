import { PrismaClient, Prisma } from "../generated/prisma";

const prisma = new PrismaClient();

export async function main() {
  const roles = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
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
      id: '550e8400-e29b-41d4-a716-446655440002',
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
      id: '550e8400-e29b-41d4-a716-446655440003',
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

  // Create standard sizes with predefined UUIDs for consistency
  const sizes = [
    {
      id: '550e8400-e29b-41d4-a716-446655440010', // Predefined UUID for XS
      name: 'XS',
      description: 'Extra Small',
      sortOrder: 1
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440011', // Predefined UUID for S
      name: 'S',
      description: 'Small',
      sortOrder: 2
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440012', // Predefined UUID for M
      name: 'M',
      description: 'Medium',
      sortOrder: 3
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440013', // Predefined UUID for L
      name: 'L',
      description: 'Large',
      sortOrder: 4
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440014', // Predefined UUID for XL
      name: 'XL',
      description: 'Extra Large',
      sortOrder: 5
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440015', // Predefined UUID for XXL
      name: 'XXL',
      description: '2X Large',
      sortOrder: 6
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440016', // Predefined UUID for XXXL
      name: 'XXXL',
      description: '3X Large',
      sortOrder: 7
    }
  ];

  console.log('Seeding sizes...');
  
  for (const size of sizes) {
    const upsertedSize = await prisma.size.upsert({
      where: { id: size.id },
      update: {
        // Update description and sort order in case they changed
        description: size.description,
        sortOrder: size.sortOrder,
      },
      create: size
    });
    
    console.log(`✅ Size "${upsertedSize.name}" (${upsertedSize.description}) seeded successfully`);
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