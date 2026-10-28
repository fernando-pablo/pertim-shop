import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  createTestApp,
  customer,
  demoToken,
  findProduct,
  resetDemoData,
} from './test-app';

describe('Painel do lojista (banco de verdade)', () => {
  let app: INestApplication<App>;
  let modaChic: string;
  let fomeSo: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDemoData(app);
    modaChic = await demoToken(app, 'moda-chic');
    fomeSo = await demoToken(app, 'fome-so');
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('exige login', async () => {
    await http().get('/panel/products').expect(401);
  });

  it('cada lojista só vê os produtos da própria loja', async () => {
    const response = await http()
      .get('/panel/products')
      .set('Authorization', `Bearer ${modaChic}`)
      .expect(200);
    const names = (response.body as { name: string }[]).map((p) => p.name);
    expect(names).toContain('Vestido Midi de Linho');
    expect(names).not.toContain('Burger Trem Bão');
  });

  it('lojista da Moda Chic não consegue mexer em produto da Fome-Sô', async () => {
    const burger = await findProduct(app, 'fome-so', 'Burger Trem Bão');

    await http()
      .patch(`/panel/products/${burger.id}`)
      .set('Authorization', `Bearer ${modaChic}`)
      .send({ priceCents: 1 })
      .expect(404);
    await http()
      .delete(`/panel/products/${burger.id}`)
      .set('Authorization', `Bearer ${modaChic}`)
      .expect(404);

    const intact = await findProduct(app, 'fome-so', 'Burger Trem Bão');
    expect(intact.id).toBe(burger.id);
  });

  it('lojista não vê pedido de outra loja', async () => {
    const torresmo = await findProduct(app, 'fome-so', 'Torresmo de Rolo');
    const created = await http()
      .post('/stores/fome-so/orders')
      .send({ ...customer, items: [{ productId: torresmo.id, quantity: 1 }] })
      .expect(201);

    await http()
      .get(`/panel/orders/${created.body.order.id}`)
      .set('Authorization', `Bearer ${modaChic}`)
      .expect(404);
    await http()
      .get(`/panel/orders/${created.body.order.id}`)
      .set('Authorization', `Bearer ${fomeSo}`)
      .expect(200);
  });

  it('cancelar o pedido devolve o estoque', async () => {
    const vestido = await findProduct(
      app,
      'moda-chic',
      'Vestido Tubinho Preto',
    );
    const tamanhoG = vestido.variants.find((v) => v.name === 'G')!; // estoque 1
    const created = await http()
      .post('/stores/moda-chic/orders')
      .send({
        ...customer,
        items: [{ productId: vestido.id, variantId: tamanhoG.id, quantity: 1 }],
      })
      .expect(201);

    const auth = { Authorization: `Bearer ${modaChic}` };
    await http()
      .patch(`/panel/orders/${created.body.order.id}/status`)
      .set(auth)
      .send({ status: 'COMPLETED' })
      .expect(400); // não pode pular de "Novo" para "Concluído"
    await http()
      .patch(`/panel/orders/${created.body.order.id}/status`)
      .set(auth)
      .send({ status: 'CANCELED' })
      .expect(200);

    const product = await http()
      .get(`/panel/products/${vestido.id}`)
      .set(auth)
      .expect(200);
    const stock = (
      product.body.variants as { name: string; stock: number }[]
    ).find((v) => v.name === 'G')!.stock;
    expect(stock).toBe(1);
  });

  it('restaurar a demonstração volta os dados e mantém o login', async () => {
    const auth = { Authorization: `Bearer ${modaChic}` };
    await http()
      .post('/panel/products')
      .set(auth)
      .send({ name: 'Produto Novo', priceCents: 1000 })
      .expect(201);

    await http().post('/panel/demo/reset').set(auth).expect(200);

    const products = await http().get('/panel/products').set(auth).expect(200);
    const names = (products.body as { name: string }[]).map((p) => p.name);
    expect(names).not.toContain('Produto Novo');
    expect(names).toHaveLength(12);
  });
});
