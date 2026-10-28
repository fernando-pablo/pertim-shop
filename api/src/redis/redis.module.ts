import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/** "Etiqueta" usada para pedir o cliente do Redis em qualquer parte da API. */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * Conexão com o Redis, um banco que guarda tudo na memória e por isso é muito
 * rápido. Na Etapa 3 ele vai guardar o catálogo pronto (cache) e contar os
 * pedidos por conexão (limite contra abuso).
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const client = new Redis(config.getOrThrow<string>('REDIS_URL'), {
          connectTimeout: 3000,
          commandTimeout: 3000,
          maxRetriesPerRequest: 1,
          // Se o Redis cair, responde erro na hora em vez de deixar a
          // requisição esperando. O cliente tenta reconectar sozinho.
          enableOfflineQueue: false,
        });

        client.on('error', (error: Error) =>
          new Logger('Redis').warn(`Erro no Redis: ${error.message}`),
        );

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }
}
