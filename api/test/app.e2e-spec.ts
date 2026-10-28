import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PG_POOL } from './../src/database/database.module';
import { REDIS_CLIENT } from './../src/redis/redis.module';

/**
 * Teste de ponta a ponta: sobe a API inteira e faz requisições HTTP de verdade.
 * Banco e Redis são substituídos por versões "de mentira" para o teste não
 * depender do Docker.
 */
describe('API (e2e)', () => {
  let app: INestApplication<App>;
  const pool = { query: jest.fn(), end: jest.fn() };
  const redis = { ping: jest.fn(), quit: jest.fn(), disconnect: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PG_POOL)
      .useValue(pool)
      .overrideProvider(REDIS_CLIENT)
      .useValue(redis)
      .compile();

    app = moduleFixture.createNestApplication();
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
    pool.query.mockResolvedValue({ rows: [] });
    redis.ping.mockResolvedValue('PONG');

    return request(app.getHttpServer()).get('/health').expect(200).expect({
      status: 'ok',
      api: 'ok',
      database: 'ok',
      redis: 'ok',
    });
  });

  it('GET /health responde 503 quando o banco está fora do ar', () => {
    pool.query.mockRejectedValue(new Error('connection refused'));
    redis.ping.mockResolvedValue('PONG');

    return request(app.getHttpServer())
      .get('/health')
      .expect(503)
      .expect((response) => {
        expect(response.body.database).toBe('error');
      });
  });
});
