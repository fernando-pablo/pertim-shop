/**
 * Cria as lojas de demonstração no banco.
 *
 *   node dist/demo/seed.cli.js             recria as lojas de demonstração
 *   node dist/demo/seed.cli.js --if-empty  só cria se o banco estiver vazio
 *
 * No Docker, roda sozinho ao ligar a API (com --if-empty).
 * Para não criar as lojas de demonstração, use SEED_DEMO=false.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { seedDemoStores } from './seed-demo';

async function main(): Promise<void> {
  if (process.env.SEED_DEMO === 'false') {
    console.log('SEED_DEMO=false: lojas de demonstração desativadas.');
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Variável DATABASE_URL não encontrada.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    await seedDemoStores(prisma, {
      onlyIfEmpty: process.argv.includes('--if-empty'),
      password: process.env.DEMO_PASSWORD ?? 'pertim-demo',
      log: (message) => console.log(message),
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Erro ao criar os dados de exemplo:', error);
  process.exit(1);
});
