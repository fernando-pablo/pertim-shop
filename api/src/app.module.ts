import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { CatalogModule } from './catalog/catalog.module';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { StoresModule } from './stores/stores.module';

/**
 * Módulo raiz: junta todos os outros módulos da API.
 * Cada assunto (banco, Redis, saúde, lojas, catálogo...) fica no seu
 * próprio módulo, com arquivos pequenos.
 */
@Module({
  imports: [
    // Lê as variáveis de ambiente e para a API na hora se faltar alguma.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    RedisModule,
    HealthModule,
    StoresModule,
    CatalogModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
