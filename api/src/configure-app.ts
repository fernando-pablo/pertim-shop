import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express } from 'express';
import { corsOrigins } from './config/cors';

/**
 * Configurações aplicadas à API, usadas também nos testes de ponta a ponta
 * para que eles rodem a API exatamente como em produção.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  // A vitrine (Next.js) roda em outro endereço e precisa poder chamar a API.
  // Em produção, só o endereço dela é aceito (CORS_ORIGINS).
  app.enableCors({ origin: corsOrigins(config.get<string>('CORS_ORIGINS')) });

  // Na hospedagem, a requisição passa por intermediários (proxies) antes de
  // chegar na API. Sem isto, todos os clientes pareceriam ter o mesmo IP (o
  // do intermediário), e o limite de tentativas valeria para todos juntos.
  const proxyHops = Number(config.get('TRUST_PROXY_HOPS') ?? 0);
  if (Number.isInteger(proxyHops) && proxyHops > 0) {
    const server = app.getHttpAdapter().getInstance() as Express;
    server.set('trust proxy', proxyHops);
  }

  // Valida tudo o que chega (parâmetros e corpo) e recusa campos desconhecidos.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Mostra só o primeiro problema de cada campo, para a mensagem ficar clara.
      stopAtFirstError: true,
    }),
  );

  // Swagger: página que lista e testa os endereços da API, em /docs.
  const docsConfig = new DocumentBuilder()
    .setTitle('Pertim Shop API')
    .setDescription(
      "Plataforma de pedidos para pequenos comércios. Tudo pertim d'ocê.",
    )
    .setVersion('0.4.0')
    // Botão "Authorize" do Swagger: cole o token do login para testar o painel.
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    'docs',
    app,
    () => SwaggerModule.createDocument(app, docsConfig),
    // Mantém o token salvo mesmo recarregando a página.
    { swaggerOptions: { persistAuthorization: true } },
  );
}
