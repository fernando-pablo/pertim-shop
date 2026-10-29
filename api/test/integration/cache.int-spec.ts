import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  createTestApp,
  customer,
  demoToken,
  findProduct,
  resetDemoData,
} from './test-app';

interface Variant {
  name: string;
  available: boolean;
}

describe('Cache da vitrine (banco e Redis de verdade)', () => {
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

  const productNames = async (slug: string) => {
    const response = await http().get(`/stores/${slug}/products`).expect(200);
    return (response.body as { name: string }[]).map((p) => p.name);
  };

  it('a vitrine sai do cache, e a mudança feita no painel aparece na hora', async () => {
    const vestido = await findProduct(
      app,
      'moda-chic',
      'Vestido Midi de Linho',
    );
    expect(await productNames('moda-chic')).toContain('Vestido Midi de Linho');

    // Mudança direto no banco, sem passar pela API: o cache não fica
    // sabendo, então a vitrine continua mostrando a resposta guardada.
    await app.get(PrismaService).product.update({
      where: { id: vestido.id },
      data: { name: 'Mudança escondida' },
    });
    expect(await productNames('moda-chic')).toContain('Vestido Midi de Linho');

    // Mudança pelo painel: o cache da loja é apagado na hora.
    const token = await demoToken(app, 'moda-chic');
    await http()
      .patch(`/panel/products/${vestido.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Vestido Midi Novo' })
      .expect(200);

    const names = await productNames('moda-chic');
    expect(names).toContain('Vestido Midi Novo');
    expect(names).not.toContain('Vestido Midi de Linho');
  });

  it('pedido e cancelamento atualizam o estoque da vitrine na hora', async () => {
    const vestido = await findProduct(
      app,
      'moda-chic',
      'Vestido Tubinho Preto',
    );
    const tamanhoG = vestido.variants.find((v) => v.name === 'G')!; // estoque 1
    const sizeG = async () => {
      const response = await http()
        .get(`/stores/moda-chic/products/${vestido.id}`)
        .expect(200);
      return (response.body.variants as Variant[]).find((v) => v.name === 'G')!;
    };
    expect((await sizeG()).available).toBe(true);

    const created = await http()
      .post('/stores/moda-chic/orders')
      .send({
        ...customer,
        items: [{ productId: vestido.id, variantId: tamanhoG.id, quantity: 1 }],
      })
      .expect(201);
    expect((await sizeG()).available).toBe(false);

    const token = await demoToken(app, 'moda-chic');
    await http()
      .patch(`/panel/orders/${created.body.order.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CANCELED' })
      .expect(200);
    expect((await sizeG()).available).toBe(true);
  });

  it('restaurar a demonstração atualiza a vitrine', async () => {
    const token = await demoToken(app, 'bicho-bao');
    await http()
      .post('/panel/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Produto Novo', priceCents: 1000 })
      .expect(201);
    expect(await productNames('bicho-bao')).toContain('Produto Novo');

    await http()
      .post('/panel/demo/reset')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(await productNames('bicho-bao')).not.toContain('Produto Novo');
  });
});
