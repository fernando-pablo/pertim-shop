import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { RedisWarning } from '../redis/redis-warning';
import { CACHE_TTL_SECONDS, cacheKeys, newCatalogVersion } from './cache-keys';

type Loader<T> = () => Promise<T>;

/**
 * Cache da vitrine no Redis.
 *
 * A vitrine é lida muitas vezes e muda pouco. A primeira resposta vai para
 * o Redis, e as próximas saem de lá, sem passar pelo banco.
 *
 * Como o cache é apagado quando algo muda: cada loja tem uma "versão" do
 * catálogo (um código aleatório), e as respostas são guardadas junto com
 * ela. Quando o lojista muda um produto, ou um pedido baixa o estoque, a
 * loja ganha uma versão nova. As respostas antigas deixam de ser usadas e
 * somem sozinhas depois de 10 minutos.
 *
 * Se o Redis falhar, a API continua funcionando: busca direto no banco.
 */
@Injectable()
export class CatalogCache {
  private readonly enabled: boolean;
  private readonly warning = new RedisWarning(
    'Cache',
    'Cache indisponível, usando o banco direto',
  );

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    config: ConfigService,
  ) {
    // CACHE_ENABLED=false desliga o cache (útil para comparar a velocidade).
    this.enabled = config.get<string>('CACHE_ENABLED') !== 'false';
  }

  /** Lista de lojas da plataforma. */
  storeList<T>(load: Loader<T>): Promise<T> {
    return this.remember(cacheKeys.storeList, load);
  }

  /** Dados públicos de uma loja, pelo endereço (slug). */
  store<T>(slug: string, load: Loader<T>): Promise<T> {
    return this.remember(cacheKeys.store(slug), load);
  }

  /** Uma resposta do catálogo da loja. Ex.: name = "categories". */
  async catalog<T>(storeId: string, name: string, load: Loader<T>): Promise<T> {
    if (!this.enabled) return load();
    const version = await this.safely(() => this.catalogVersion(storeId));
    if (!version) return load();
    return this.remember(cacheKeys.catalog(storeId, version, name), load);
  }

  /** Dá uma versão nova ao catálogo da loja: o que estava guardado deixa de valer. */
  async invalidateStore(storeId: string): Promise<void> {
    await this.safely(() =>
      this.redis.set(cacheKeys.catalogVersion(storeId), newCatalogVersion()),
    );
  }

  private async catalogVersion(storeId: string): Promise<string> {
    const key = cacheKeys.catalogVersion(storeId);
    const current = await this.redis.get(key);
    if (current) return current;

    // Primeira vez (ou o Redis foi reiniciado): cria a versão. "NX" só
    // grava se ninguém gravou antes, então duas requisições ao mesmo tempo
    // acabam usando a mesma versão.
    const created = newCatalogVersion();
    await this.redis.set(key, created, 'NX');
    return (await this.redis.get(key)) ?? created;
  }

  /** Devolve do cache; se não tiver, busca no banco e guarda por 10 minutos. */
  private async remember<T>(key: string, load: Loader<T>): Promise<T> {
    if (!this.enabled) return load();

    const saved = await this.safely(() => this.redis.get(key));
    if (saved) return JSON.parse(saved) as T;

    const value = await load();
    await this.safely(() =>
      this.redis.set(key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS),
    );
    return value;
  }

  /** Roda um comando no Redis. Se falhar, avisa no log e devolve null. */
  private async safely<T>(command: () => Promise<T>): Promise<T | null> {
    try {
      return await command();
    } catch (error) {
      this.warning.warn(error);
      return null;
    }
  }
}

/**
 * Apaga o cache de lojas inteiras. Usado pelo seed, que recria os dados
 * direto no banco, sem passar pela API.
 */
export async function clearStoresCache(
  redis: Redis,
  stores: { id: string; slug: string }[],
): Promise<void> {
  const pipeline = redis.pipeline().del(cacheKeys.storeList);
  for (const store of stores) {
    pipeline
      .set(cacheKeys.catalogVersion(store.id), newCatalogVersion())
      .del(cacheKeys.store(store.slug));
  }
  await pipeline.exec();
}
