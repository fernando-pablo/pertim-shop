import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp, resetDemoData } from './test-app';

interface SearchResult {
  match: 'exact' | 'similar' | 'none';
  products: { name: string }[];
}

describe('Busca da vitrine (PostgreSQL com unaccent e pg_trgm)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDemoData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const search = async (slug: string, q: string) => {
    const response = await request(app.getHttpServer())
      .get(`/stores/${slug}/search`)
      .query({ q })
      .expect(200);
    const body = response.body as SearchResult;
    return { match: body.match, names: body.products.map((p) => p.name) };
  };

  it('ignora acentos e maiúsculas', async () => {
    for (const q of ['racao', 'RAÇÃO', 'Ração']) {
      const result = await search('bicho-bao', q);
      expect(result.match).toBe('exact');
      expect(result.names).toEqual([
        'Ração Premium Cães Adultos',
        'Ração Premium Gatos Castrados',
        'Ração Filhotes',
      ]);
    }
  });

  it('acha pedaço de palavra, com o nome que começa assim primeiro', async () => {
    const { names } = await search('bicho-bao', 'ra');
    expect(names.slice(0, 3).every((name) => name.startsWith('Ração'))).toBe(
      true,
    );
    expect(names).toContain('Arranhador para Gatos');
  });

  it('aceita várias palavras em qualquer ordem', async () => {
    expect((await search('bicho-bao', 'gato racao')).names).toEqual([
      'Ração Premium Gatos Castrados',
    ]);
  });

  it('busca também pelo nome da categoria', async () => {
    const { names } = await search('fome-so', 'bebidas');
    expect(names).toEqual(
      expect.arrayContaining([
        'Refrigerante Lata',
        'Suco Natural 500 ml',
        'Água Mineral',
      ]),
    );
  });

  it('perdoa erros pequenos de digitação ("resultados parecidos")', async () => {
    const racao = await search('bicho-bao', 'rasao');
    expect(racao.match).toBe('similar');
    expect(racao.names).toHaveLength(3);
    expect(racao.names.every((name) => name.startsWith('Ração'))).toBe(true);

    expect(await search('fome-so', 'pudin')).toEqual({
      match: 'similar',
      names: ['Pudim de Leite'],
    });
  });

  it('não inventa resultado quando nada parece', async () => {
    expect(await search('fome-so', 'sabonete')).toEqual({
      match: 'none',
      names: [],
    });
  });

  it('cada loja só busca nos próprios produtos, e só nos ativos', async () => {
    expect((await search('moda-chic', 'racao')).names).toEqual([]);

    const prisma = app.get(PrismaService);
    await prisma.product.updateMany({
      where: { name: 'Pudim de Leite' },
      data: { isActive: false },
    });
    expect((await search('fome-so', 'pudim')).names).toEqual([]);
    await resetDemoData(app);
  });

  it('a lista com ?search= usa a mesma busca sem acento', async () => {
    const response = await request(app.getHttpServer())
      .get('/stores/bicho-bao/products')
      .query({ search: 'racao gato' })
      .expect(200);
    expect((response.body as { name: string }[]).map((p) => p.name)).toEqual([
      'Ração Premium Gatos Castrados',
    ]);
  });

  it('recusa busca vazia ou longa demais', async () => {
    await request(app.getHttpServer())
      .get('/stores/fome-so/search')
      .query({ q: '   ' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/stores/fome-so/search')
      .query({ q: 'x'.repeat(61) })
      .expect(400);
  });
});
