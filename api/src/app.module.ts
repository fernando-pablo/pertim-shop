import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';

/**
 * Módulo raiz: junta todos os outros módulos da API.
 * Cada assunto (banco, Redis, saúde, e depois lojas, produtos, pedidos...)
 * fica no seu próprio módulo.
 */
@Module({
  imports: [
    // Lê as variáveis de ambiente e para a API na hora se faltar alguma.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DatabaseModule,
    RedisModule,
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
