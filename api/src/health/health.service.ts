import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CatalogCache } from '../cache/catalog-cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { CheckStatus, HealthReport } from './dto/health-report.dto';

/**
 * Confere se a API consegue falar com o banco e com o Redis.
 * A hospedagem usa essa resposta para saber se a API está saudável.
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly cache: CatalogCache,
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
      cache: this.cache.isEnabled ? 'on' : 'off',
    };
  }

  private async checkDatabase(): Promise<CheckStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
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
