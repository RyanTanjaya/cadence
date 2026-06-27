/**
 * Seeds a demo account so the app looks alive for portfolio demos.
 *   email: demo@cadence.app   password: password123
 * Idempotent: re-running resets the demo user's habits + completions.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedDemoHabits } from '../src/utils/demoSeed';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@cadence.app' },
    update: {},
    create: { email: 'demo@cadence.app', name: 'Demo', passwordHash },
  });

  const count = await seedDemoHabits(prisma, user.id);
  console.log(`Seeded demo@cadence.app with ${count} habits.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
