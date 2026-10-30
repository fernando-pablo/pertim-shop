import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Acesso ao banco de dados pelo Prisma (ORM).
 * Em vez de escrever SQL na mão, a API usa métodos tipados como
 * `prisma.product.findMany()`. A conexão é aberta na primeira consulta.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: config.getOrThrow<string>('DATABASE_URL'),
        max: 10,
        // Na hospedagem, o banco grátis (Neon) dorme sem uso e acorda na
        // primeira consulta. A folga evita erro enquanto ele acorda.
        connectionTimeoutMillis: 10_000,
      }),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
