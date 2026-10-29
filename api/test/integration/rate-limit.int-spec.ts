import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, resetDemoData } from './test-app';

describe('Limite de tentativas (Redis de verdade)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDemoData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('login: depois de 10 tentativas, responde 429 por 15 minutos', async () => {
    const wrong = {
      email: 'lojista@moda-chic.pertim.example',
      password: 'senha-errada',
    };
    for (let i = 0; i < 10; i++) {
      await http().post('/auth/login').send(wrong).expect(401);
    }

    const blocked = await http().post('/auth/login').send(wrong).expect(429);

    expect(blocked.body.message).toBe(
      'Muitas tentativas. Tente de novo em 15 minutos.',
    );
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(890);
  });

  it('pedidos: 20 por IP em cada loja; as outras lojas continuam abertas', async () => {
    for (let i = 0; i < 20; i++) {
      // Pedido vazio (400) também conta: o robô é barrado antes da validação.
      await http().post('/stores/fome-so/orders').send({}).expect(400);
    }

    await http().post('/stores/fome-so/orders').send({}).expect(429);
    await http().post('/stores/bicho-bao/orders').send({}).expect(400);
  });
});
