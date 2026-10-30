import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/configure-app';
import { PrismaService } from './../src/prisma/prisma.service';
import { REDIS_CLIENT } from './../src/redis/redis.module';

/**
 * Teste de ponta a ponta: sobe a API inteira e faz requisições HTTP de verdade.
 * Banco e Redis são substituídos por versões "de mentira" para o teste não
 * depender do Docker.
 */
describe('API (e2e)', () => {
  let app: INestApplication<App>;
  const prisma = {
    $queryRaw: jest.fn(),
    store: { findFirst: jest.fn(), findMany: jest.fn() },
    category: { findMany: jest.fn() },
    product: { findMany: jest.fn(), findFirst: jest.fn() },
  };
  const redis = {
    ping: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    quit: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(REDIS_CLIENT)
      .useValue(redis)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET / mostra o nome da API', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((response) => {
        expect(response.body.name).toBe('Pertim Shop API');
      });
  });

  it('GET /health responde 200 quando banco e Redis estão ok', () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.ping.mockResolvedValue('PONG');

    return request(app.getHttpServer()).get('/health').expect(200).expect({
      status: 'ok',
      api: 'ok',
      database: 'ok',
      redis: 'ok',
      cache: 'on',
    });
  });

  it('GET /health responde 503 quando o banco está fora do ar', () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
    redis.ping.mockResolvedValue('PONG');

    return request(app.getHttpServer())
      .get('/health')
      .expect(503)
      .expect((response) => {
        expect(response.body.database).toBe('error');
      });
  });

  it('GET /stores/:slug responde 404 para loja que não existe', () => {
    prisma.store.findFirst.mockResolvedValue(null);

    return request(app.getHttpServer())
      .get('/stores/loja-que-nao-existe')
      .expect(404)
      .expect((response) => {
        expect(response.body.message).toBe('Loja não encontrada');
      });
  });

  it('recusa id de produto inválido com 400', () => {
    return request(app.getHttpServer())
      .get('/stores/moda-chic/products/nao-e-um-id')
      .expect(400);
  });

  it('recusa filtros desconhecidos com 400', () => {
    return request(app.getHttpServer())
      .get('/stores/moda-chic/products?preco=0')
      .expect(400);
  });

  it('GET /docs mostra a documentação (Swagger)', () => {
    return request(app.getHttpServer()).get('/docs').expect(200);
  });

  it('a medição dos intermediários fica desligada por padrão', () => {
    return request(app.getHttpServer()).get('/debug/proxy').expect(404);
  });
});
