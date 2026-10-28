import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ao desligar (ex.: docker compose down), fecha com calma as conexões
  // com o banco e o Redis em vez de cortar no meio.
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3333);
  // 0.0.0.0 = aceita conexões de fora do contêiner (necessário no Docker).
  await app.listen(port, '0.0.0.0');

  Logger.log(`API do Pertim Shop rodando na porta ${port}`, 'Bootstrap');
}

void bootstrap();
