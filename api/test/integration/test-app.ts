import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/configure-app';
import { seedDemoStores } from '../../src/demo/seed-demo';
import { PrismaService } from '../../src/prisma/prisma.service';
import { REDIS_CLIENT } from '../../src/redis/redis.module';

/** Sobe a API com o banco de verdade (só o Redis é simulado). */
export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(REDIS_CLIENT)
    .useValue({ ping: jest.fn(), quit: jest.fn(), disconnect: jest.fn() })
    .compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}

/** Volta as lojas de demonstração ao estado original. */
export async function resetDemoData(app: INestApplication): Promise<void> {
  await seedDemoStores(app.get(PrismaService), {
    password: process.env.DEMO_PASSWORD ?? 'pertim-demo',
  });
}

interface ProductSummary {
  id: string;
  name: string;
}

/** Busca um produto da vitrine pelo nome. */
export async function findProduct(
  app: INestApplication<App>,
  slug: string,
  name: string,
) {
  const list = await request(app.getHttpServer()).get(
    `/stores/${slug}/products`,
  );
  const summary = (list.body as ProductSummary[]).find((p) => p.name === name);
  if (!summary) throw new Error(`Produto não encontrado: ${name}`);
  const detail = await request(app.getHttpServer()).get(
    `/stores/${slug}/products/${summary.id}`,
  );
  return detail.body as {
    id: string;
    variants: { id: string; name: string }[];
    addonGroups: { name: string; addons: { id: string; name: string }[] }[];
  };
}

/** Entra no painel de uma loja de demonstração e devolve o token. */
export async function demoToken(
  app: INestApplication<App>,
  slug: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/demo-login')
    .send({ slug })
    .expect(200);
  return (response.body as { accessToken: string }).accessToken;
}

export const customer = {
  customerName: 'Cliente Teste',
  customerPhone: '(38) 99999-0000',
  fulfillment: 'PICKUP',
};
