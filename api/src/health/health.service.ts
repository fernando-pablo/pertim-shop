import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { REDIS_CLIENT } from '../redis/redis.module';

export type CheckStatus = 'ok' | 'error';

export interface HealthReport {
  status: CheckStatus;
  api: CheckStatus;
  database: CheckStatus;
  redis: CheckStatus;
}

/**
 * Confere se a API consegue falar com o banco e com o Redis.
 * A hospedagem usa essa resposta para saber se a API está saudável.
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async check(): Promise<HealthReport> {
    // Testa os dois ao mesmo tempo, para responder mais rápido.
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    return {
      status: database === 'ok' && redis === 'ok' ? 'ok' : 'error',
      api: 'ok',
      database,
      redis,
    };
  }

  private async checkDatabase(): Promise<CheckStatus> {
    try {
      await this.pool.query('SELECT 1');
      return 'ok';
    } catch (error) {
      this.logger.warn(`Banco indisponível: ${(error as Error).message}`);
      return 'error';
    }
  }

  private async checkRedis(): Promise<CheckStatus> {
    try {
      const reply = await this.redis.ping();
      return reply === 'PONG' ? 'ok' : 'error';
    } catch (error) {
      this.logger.warn(`Redis indisponível: ${(error as Error).message}`);
      return 'error';
    }
  }
}
