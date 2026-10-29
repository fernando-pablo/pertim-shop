import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { FakeRedis } from '../../test/fakes/fake-redis';
import { CatalogCache } from '../cache/catalog-cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { DemoResetService } from './demo-reset.service';

describe('DemoResetService (limpeza automática da demonstração)', () => {
  const DAY = 24 * 60 * 60 * 1000;
  let redis: FakeRedis;
  let clock: number;
  let service: DemoResetService;
  let restore: jest.SpyInstance;

  const prisma = {
    store: {
      findMany: jest
        .fn()
        .mockResolvedValue([{ slug: 'fome-so' }, { slug: 'moda-chic' }]),
    },
  };

  function create(hours?: string) {
    const config = {
      get: (name: string) => (name === 'DEMO_RESET_HOURS' ? hours : undefined),
    };
    return new DemoResetService(
      prisma as unknown as PrismaService,
      redis as unknown as Redis,
      {} as CatalogCache,
      config as unknown as ConfigService,
    );
  }

  beforeEach(() => {
    clock = Date.now();
    redis = new FakeRedis();
    redis.now = () => clock;
    service = create();
    restore = jest.spyOn(service, 'restore').mockResolvedValue();
  });

  it('restaura cada loja de demonstração uma vez por dia', async () => {
    await expect(service.run()).resolves.toEqual(['fome-so', 'moda-chic']);
    // Uma hora depois: ainda dentro do mesmo dia, não mexe.
    clock += 60 * 60 * 1000;
    await expect(service.run()).resolves.toEqual([]);
    // Passou um dia: restaura de novo.
    clock += DAY;
    await expect(service.run()).resolves.toEqual(['fome-so', 'moda-chic']);
    expect(restore).toHaveBeenCalledTimes(4);
  });

  it('com duas cópias da API ao mesmo tempo, só uma restaura', async () => {
    const other = create();
    jest.spyOn(other, 'restore').mockResolvedValue();

    const [first, second] = await Promise.all([service.run(), other.run()]);

    expect([...first, ...second].sort()).toEqual(['fome-so', 'moda-chic']);
  });

  it('se a restauração falhar, tenta de novo na próxima checagem', async () => {
    restore.mockRejectedValueOnce(new Error('banco fora do ar'));

    await expect(service.run()).resolves.toEqual(['moda-chic']);
    await expect(service.run()).resolves.toEqual(['fome-so']);
  });

  it('com o Redis fora do ar, não restaura nada', async () => {
    redis.failing = true;
    await expect(service.run()).resolves.toEqual([]);
    expect(restore).not.toHaveBeenCalled();
  });

  it('DEMO_RESET_HOURS=0 desliga a limpeza', () => {
    const timers = jest.spyOn(global, 'setInterval');
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      create('0').onApplicationBootstrap();
      expect(timers).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = original;
      timers.mockRestore();
    }
  });
});
