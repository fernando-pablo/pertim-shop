import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Configurações aplicadas à API, usadas também nos testes de ponta a ponta
 * para que eles rodem a API exatamente como em produção.
 */
export function configureApp(app: INestApplication): void {
  // A vitrine (Next.js) roda em outro endereço e precisa poder chamar a API.
  app.enableCors();

  // Valida tudo o que chega (parâmetros e corpo) e recusa campos desconhecidos.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger: página que lista e testa os endereços da API, em /docs.
  const config = new DocumentBuilder()
    .setTitle('Pertim Shop API')
    .setDescription(
      "Plataforma de pedidos para pequenos comércios. Tudo pertim d'ocê.",
    )
    .setVersion('0.2.0')
    .build();

  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
