import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  createTestApp,
  customer,
  findProduct,
  resetDemoData,
} from './test-app';

describe('Pedidos (banco de verdade)', () => {
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

  const order = (slug: string, body: object) =>
    request(app.getHttpServer()).post(`/stores/${slug}/orders`).send(body);

  it('calcula o total no servidor e devolve a mensagem do WhatsApp', async () => {
    const burger = await findProduct(app, 'fome-so', 'Burger Trem Bão');
    const [ponto, extras] = burger.addonGroups;
    const aoPonto = ponto.addons.find((a) => a.name === 'Ao ponto')!;
    const bacon = extras.addons.find((a) => a.name === 'Bacon')!;

    const response = await order('fome-so', {
      ...customer,
      items: [
        { productId: burger.id, quantity: 2, addonIds: [aoPonto.id, bacon.id] },
      ],
    }).expect(201);

    // (R$ 32,90 + R$ 4,00 de bacon) x 2 = R$ 73,80
    expect(response.body.order.totalCents).toBe(7380);
    expect(response.body.order.number).toBe(1);
    expect(response.body.whatsapp.message).toContain('*Total: R$ 73,80*');
    expect(response.body.isDemo).toBe(true);
  });

  it('numera os pedidos de cada loja separadamente', async () => {
    const torresmo = await findProduct(app, 'fome-so', 'Torresmo de Rolo');
    const shampoo = await findProduct(
      app,
      'bicho-bao',
      'Shampoo Neutro 500 ml',
    );
    const lanche = {
      ...customer,
      items: [{ productId: torresmo.id, quantity: 1 }],
    };
    const pet = {
      ...customer,
      items: [{ productId: shampoo.id, quantity: 1 }],
    };

    const numbers = [
      (await order('fome-so', lanche)).body.order.number,
      (await order('fome-so', lanche)).body.order.number,
      (await order('bicho-bao', pet)).body.order.number,
    ];
    expect(numbers).toEqual([1, 2, 1]);
  });

  it('baixa o estoque e recusa quando não há quantidade suficiente', async () => {
    const racao = await findProduct(
      app,
      'bicho-bao',
      'Ração Premium Cães Adultos',
    );
    const pack15 = racao.variants.find((v) => v.name === '15 kg')!; // estoque 3
    const body = {
      ...customer,
      items: [{ productId: racao.id, variantId: pack15.id, quantity: 2 }],
    };

    await order('bicho-bao', body).expect(201);
    const second = await order('bicho-bao', body).expect(409);
    expect(second.body.message).toContain('Estoque insuficiente');
  });

  it('na disputa pelas últimas unidades, ninguém compra além do estoque', async () => {
    const arranhador = await findProduct(
      app,
      'bicho-bao',
      'Arranhador para Gatos',
    ); // estoque 2
    const body = {
      ...customer,
      items: [{ productId: arranhador.id, quantity: 1 }],
    };

    const results = await Promise.all(
      Array.from({ length: 6 }, () => order('bicho-bao', body)),
    );
    const statuses = results.map((r) => r.status).sort((a, b) => a - b);
    expect(statuses).toEqual([201, 201, 409, 409, 409, 409]);
  });

  it('não aceita preço vindo do navegador', async () => {
    const torresmo = await findProduct(app, 'fome-so', 'Torresmo de Rolo');
    await order('fome-so', {
      ...customer,
      totalCents: 1,
      items: [{ productId: torresmo.id, quantity: 1 }],
    }).expect(400);
  });

  it('não aceita produto de outra loja no carrinho', async () => {
    const vestido = await findProduct(
      app,
      'moda-chic',
      'Vestido Tubinho Preto',
    );
    await order('fome-so', {
      ...customer,
      items: [{ productId: vestido.id, quantity: 1 }],
    }).expect(400);
  });
});
