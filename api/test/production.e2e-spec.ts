import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/configure-app';
import { PrismaService } from './../src/prisma/prisma.service';
import { REDIS_CLIENT } from './../src/redis/redis.module';

/**
 * A API configurada como na hospedagem: só o site da vitrine pode chamá-la
 * pelo navegador, e a medição dos intermediários está ligada.
 */
describe('API na hospedagem (e2e)', () => {
  const VITRINE = 'https://pertim-shop.vercel.app';
  const saved = { ...process.env };
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.CORS_ORIGINS = `${VITRINE}/`;
    process.env.PROXY_DEBUG = 'true';
    process.env.TRUST_PROXY_HOPS = '1';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: jest.fn() })
      .overrideProvider(REDIS_CLIENT)
      .useValue({ ping: jest.fn(), quit: jest.fn(), disconnect: jest.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env = saved;
  });

  it('aceita chamadas do site da vitrine', async () => {
    const response = await request(app.getHttpServer())
      .options('/stores')
      .set('Origin', VITRINE)
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(VITRINE);
  });

  it('não libera outros sites', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .set('Origin', 'https://outro-site.com')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('a medição mostra o caminho e o IP que a API enxerga', async () => {
    const response = await request(app.getHttpServer())
      .get('/debug/proxy')
      .set('X-Forwarded-For', '203.0.113.7')
      .expect(200);

    expect(response.body).toMatchObject({
      forwardedFor: ['203.0.113.7'],
      ip: '203.0.113.7',
      trustProxyHops: 1,
    });
  });
});
