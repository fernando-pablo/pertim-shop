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
import { Redis } from 'ioredis';
import { clearStoresCache } from '../cache/catalog-cache.service';
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
    const slugs = await seedDemoStores(prisma, {
      onlyIfEmpty: process.argv.includes('--if-empty'),
      password: process.env.DEMO_PASSWORD ?? 'pertim-demo',
      log: (message) => console.log(message),
    });
    if (slugs.length > 0) {
      const stores = await prisma.store.findMany({
        where: { slug: { in: slugs } },
        select: { id: true, slug: true },
      });
      await clearCache(stores);
    }
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Os produtos foram recriados direto no banco: o cache da vitrine dessas
 * lojas precisa ser apagado. Se o Redis não responder, só avisa.
 */
async function clearCache(stores: { id: string; slug: string }[]) {
  const url = process.env.REDIS_URL;
  if (!url) return;

  const redis = new Redis(url, {
    lazyConnect: true,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });
  redis.on('error', () => undefined);
  try {
    await redis.connect();
    await clearStoresCache(redis, stores);
    console.log('Cache da vitrine limpo.');
  } catch {
    console.warn('Aviso: não foi possível limpar o cache do Redis.');
  } finally {
    redis.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Erro ao criar os dados de exemplo:', error);
  process.exit(1);
});
