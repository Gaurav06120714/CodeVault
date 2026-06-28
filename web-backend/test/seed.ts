import { PrismaClient, PlatformType } from '@prisma/client';
import { signToken } from '../src/utils/jwt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding load tester user...');
  
  // Clean up if exists
  await prisma.connection.deleteMany({ where: { user: { handle: 'loadtester' } } });
  await prisma.user.deleteMany({ where: { handle: 'loadtester' } });

  const loadTester = await prisma.user.create({
    data: {
      githubLogin: 'loadtester',
      email: 'loadtester@example.com',
      handle: 'loadtester',
      displayName: 'Load Tester',
      publicProfileEnabled: true,
      connections: {
        create: [
          {
            platform: PlatformType.leetcode,
            username: 'sastry', // valid user for fetching
            tokenStatus: 'active',
          },
          {
            platform: PlatformType.codeforces,
            username: 'tourist', // valid user for fetching
            tokenStatus: 'active',
          }
        ]
      }
    },
  });

  console.log('User created:', loadTester.id);
  
  const token = signToken({ userId: loadTester.id });
  console.log('====================================');
  console.log('JWT_ACCESS_TOKEN=' + token);
  console.log('====================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
