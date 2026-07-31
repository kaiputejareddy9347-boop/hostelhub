import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultFacilities = [
    'WiFi', 
    'AC', 
    'Gym', 
    'Laundry', 
    'Mess / Food', 
    'CCTV Security', 
    'Power Backup', 
    'Water Purifier'
  ];

  console.log('Seeding default facilities...');

  for (const name of defaultFacilities) {
    await prisma.facility.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
