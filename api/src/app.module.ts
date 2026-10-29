import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CatalogCacheModule } from './cache/catalog-cache.module';
import { CatalogModule } from './catalog/catalog.module';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { OrdersModule } from './orders/orders.module';
import { PanelModule } from './panel/panel.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { StoresModule } from './stores/stores.module';

/**
 * Módulo raiz: junta todos os outros módulos da API.
 * Cada assunto (banco, Redis, cache, lojas, catálogo, pedidos, login,
 * painel) fica no seu próprio módulo, com arquivos pequenos.
 */
@Module({
  imports: [
    // Lê as variáveis de ambiente e para a API na hora se faltar alguma.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    RedisModule,
    CatalogCacheModule,
    HealthModule,
    StoresModule,
    CatalogModule,
    OrdersModule,
    AuthModule,
    PanelModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
