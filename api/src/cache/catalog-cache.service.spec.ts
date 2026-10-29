import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { FakeRedis } from '../../test/fakes/fake-redis';
import { CatalogCache } from './catalog-cache.service';

describe('CatalogCache', () => {
  let redis: FakeRedis;

  const createCache = (cacheEnabled?: string) =>
    new CatalogCache(
      redis as unknown as Redis,
      {
        get: () => cacheEnabled,
      } as unknown as ConfigService,
    );

  beforeEach(() => {
    redis = new FakeRedis();
  });

  it('a segunda leitura sai do cache, sem ir ao banco', async () => {
    const cache = createCache();
    const load = jest.fn().mockResolvedValue([{ name: 'Vestido' }]);

    await cache.catalog('loja-1', 'products', load);
    const second = await cache.catalog('loja-1', 'products', load);

    expect(second).toEqual([{ name: 'Vestido' }]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('guarda cada resposta por 10 minutos', async () => {
    const cache = createCache();
    await cache.catalog('loja-1', 'products', () => Promise.resolve([]));

    const key = [...redis.data.keys()].find((k) => k.endsWith(':products'))!;
    expect(await redis.ttl(key)).toBe(600);
  });

  it('depois de invalidar, busca de novo no banco', async () => {
    const cache = createCache();
    const load = jest
      .fn()
      .mockResolvedValueOnce(['preço antigo'])
      .mockResolvedValueOnce(['preço novo']);

    await cache.catalog('loja-1', 'products', load);
    await cache.invalidateStore('loja-1');
    const after = await cache.catalog('loja-1', 'products', load);

    expect(after).toEqual(['preço novo']);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('invalidar uma loja não apaga o cache da outra', async () => {
    const cache = createCache();
    const load = jest.fn().mockResolvedValue([]);

    await cache.catalog('loja-2', 'products', load);
    await cache.invalidateStore('loja-1');
    await cache.catalog('loja-2', 'products', load);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('erro (ex.: loja não encontrada) não vai para o cache', async () => {
    const cache = createCache();
    const load = jest
      .fn()
      .mockRejectedValueOnce(new Error('Loja não encontrada'))
      .mockResolvedValueOnce({ slug: 'moda-chic' });

    await expect(cache.store('moda-chic', load)).rejects.toThrow();
    await expect(cache.store('moda-chic', load)).resolves.toEqual({
      slug: 'moda-chic',
    });
  });

  it('com o Redis fora do ar, busca direto no banco', async () => {
    const cache = createCache();
    redis.failing = true;
    const load = jest.fn().mockResolvedValue(['ok']);

    await expect(cache.catalog('loja-1', 'products', load)).resolves.toEqual([
      'ok',
    ]);
    await expect(cache.storeList(load)).resolves.toEqual(['ok']);
    await expect(cache.invalidateStore('loja-1')).resolves.toBeUndefined();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('CACHE_ENABLED=false desliga o cache', async () => {
    const cache = createCache('false');
    const load = jest.fn().mockResolvedValue([]);

    await cache.catalog('loja-1', 'products', load);
    await cache.catalog('loja-1', 'products', load);
    await cache.store('moda-chic', load);

    expect(load).toHaveBeenCalledTimes(3);
    expect(redis.data.size).toBe(0);
  });
});
