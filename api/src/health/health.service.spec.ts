import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { HealthService } from './health.service';

/**
 * Testes de unidade: o banco e o Redis são "de mentira" (mocks),
 * então os testes rodam em qualquer lugar, sem Docker.
 */
describe('HealthService', () => {
  const prisma = { $queryRaw: jest.fn() };
  const redis = { ping: jest.fn() };
  let service: HealthService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prisma },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = moduleRef.get(HealthService);
  });

  it('responde ok quando banco e Redis respondem', async () => {
    prisma.$queryRaw.mockResolvedValue({ rows: [{ '?column?': 1 }] });
    redis.ping.mockResolvedValue('PONG');

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      api: 'ok',
      database: 'ok',
      redis: 'ok',
    });
  });

  it('aponta erro no banco quando ele está fora do ar', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
    redis.ping.mockResolvedValue('PONG');

    await expect(service.check()).resolves.toEqual({
      status: 'error',
      api: 'ok',
      database: 'error',
      redis: 'ok',
    });
  });

  it('aponta erro no Redis quando ele está fora do ar', async () => {
    prisma.$queryRaw.mockResolvedValue({ rows: [] });
    redis.ping.mockRejectedValue(new Error('Connection is closed'));

    await expect(service.check()).resolves.toEqual({
      status: 'error',
      api: 'ok',
      database: 'ok',
      redis: 'error',
    });
  });
});
