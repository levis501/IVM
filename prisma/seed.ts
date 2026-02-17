import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed script placeholder - to be implemented in M02');
  // Seed data will be added in M02:
  // - Standard roles (dbadmin, publisher, calendar, verifier, user, owner)
  // - Bootstrap user
  // - SystemConfig defaults
  // - EmailTemplate defaults
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
