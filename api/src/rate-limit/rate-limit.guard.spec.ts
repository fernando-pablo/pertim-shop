import { ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Redis } from 'ioredis';
import { FakeRedis } from '../../test/fakes/fake-redis';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitRule } from './rate-limit.rule';

describe('RateLimitGuard', () => {
  const rule: RateLimitRule = { name: 'login', limit: 3, windowSeconds: 900 };
  const reflector = { get: jest.fn() };
  let redis: FakeRedis;
  let guard: RateLimitGuard;

  const call = (ip: string, params: Record<string, string> = {}) => {
    const response = { setHeader: jest.fn() };
    const context = {
      getHandler: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ ip, params }),
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
    return { attempt: () => guard.canActivate(context), response };
  };

  const useAllAttempts = async (ip: string) => {
    for (let i = 0; i < rule.limit; i++) {
      await expect(call(ip).attempt()).resolves.toBe(true);
    }
  };

  beforeEach(() => {
    jest.resetAllMocks();
    reflector.get.mockReturnValue(rule);
    redis = new FakeRedis();
    guard = new RateLimitGuard(
      reflector as unknown as Reflector,
      redis as unknown as Redis,
    );
  });

  it('deixa passar até o limite e depois responde 429', async () => {
    await useAllAttempts('1.1.1.1');

    const blocked = call('1.1.1.1');
    const error = await blocked.attempt().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
    expect((error as HttpException).getResponse()).toMatchObject({
      message: 'Muitas tentativas. Tente de novo em 15 minutos.',
    });
    expect(blocked.response.setHeader).toHaveBeenCalledWith(
      'Retry-After',
      '900',
    );
  });

  it('conta cada IP separado', async () => {
    await useAllAttempts('1.1.1.1');

    await expect(call('2.2.2.2').attempt()).resolves.toBe(true);
  });

  it('nas rotas de uma loja, conta cada loja separado', async () => {
    for (let i = 0; i < rule.limit; i++) {
      await call('1.1.1.1', { slug: 'fome-so' }).attempt();
    }

    await expect(
      call('1.1.1.1', { slug: 'fome-so' }).attempt(),
    ).rejects.toBeInstanceOf(HttpException);
    await expect(
      call('1.1.1.1', { slug: 'bicho-bao' }).attempt(),
    ).resolves.toBe(true);
  });

  it('quando a janela de tempo acaba, a contagem recomeça', async () => {
    await useAllAttempts('1.1.1.1');
    const later = Date.now() + 901_000;
    redis.now = () => later;

    await expect(call('1.1.1.1').attempt()).resolves.toBe(true);
  });

  it('com o Redis fora do ar, deixa passar', async () => {
    redis.failing = true;

    for (let i = 0; i < rule.limit + 2; i++) {
      await expect(call('1.1.1.1').attempt()).resolves.toBe(true);
    }
  });

  it('rota sem regra passa direto', async () => {
    reflector.get.mockReturnValue(undefined);

    await expect(call('1.1.1.1').attempt()).resolves.toBe(true);
    expect(redis.data.size).toBe(0);
  });
});
