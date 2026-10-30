import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { passThroughCache } from '../../test/fakes/fake-redis';
import { CatalogCache } from '../cache/catalog-cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { StoresService } from '../stores/stores.service';
import { CatalogService } from './catalog.service';
import { ProductSearchService } from './product-search.service';

describe('CatalogService', () => {
  const prisma = {
    category: { findMany: jest.fn() },
    product: { findMany: jest.fn(), findFirst: jest.fn() },
  };
  const stores = { findActiveBySlug: jest.fn() };
  const cache = { ...passThroughCache, catalog: jest.fn() };
  const searcher = { findExact: jest.fn(), search: jest.fn() };
  /** Linha do banco com o mínimo que o mapper usa. */
  const row = (id: string, categoryId: string) => ({
    id,
    name: id,
    description: null,
    imageUrl: null,
    isFeatured: false,
    priceCents: 1000,
    category: { id: categoryId, name: categoryId },
    variants: [],
  });
  let service: CatalogService;

  beforeEach(async () => {
    jest.resetAllMocks();
    stores.findActiveBySlug.mockResolvedValue({
      id: 'loja-1',
      slug: 'moda-chic',
    });
    cache.catalog.mockImplementation(
      (_storeId: string, _name: string, load: () => Promise<unknown>) => load(),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaService, useValue: prisma },
        { provide: StoresService, useValue: stores },
        { provide: CatalogCache, useValue: cache },
        { provide: ProductSearchService, useValue: searcher },
      ],
    }).compile();

    service = moduleRef.get(CatalogService);
  });

  it('busca só os produtos ativos da loja certa', async () => {
    prisma.product.findMany.mockResolvedValue([]);

    await service.listProducts('moda-chic', {});

    const { where } = prisma.product.findMany.mock.calls[0][0];
    expect(where).toEqual({ storeId: 'loja-1', isActive: true });
  });

  it('a lista completa usa o cache; busca e filtro vão direto ao banco', async () => {
    prisma.product.findMany.mockResolvedValue([]);

    await service.listProducts('moda-chic', {});
    expect(cache.catalog).toHaveBeenCalledWith(
      'loja-1',
      'products',
      expect.any(Function),
    );

    cache.catalog.mockClear();
    searcher.findExact.mockResolvedValue([]);
    await service.listProducts('moda-chic', { search: 'Linho' });
    await service.listProducts('moda-chic', { category: 'cat-1' });
    expect(cache.catalog).not.toHaveBeenCalled();
    expect(searcher.findExact).toHaveBeenCalledWith('loja-1', ['linho']);
  });

  it('a busca mantém a ordem de importância e respeita a categoria', async () => {
    searcher.findExact.mockResolvedValue(['p3', 'p1', 'p2']);
    prisma.product.findMany.mockResolvedValue([
      row('p1', 'cat-1'),
      row('p2', 'cat-2'),
      row('p3', 'cat-1'),
    ]);

    const found = await service.listProducts('moda-chic', {
      category: 'cat-1',
      search: 'vestido',
    });

    expect(found.map((product) => product.id)).toEqual(['p3', 'p1']);
  });

  it('a rota de busca devolve o tipo de resultado (exato ou parecido)', async () => {
    searcher.search.mockResolvedValue({ match: 'similar', ids: ['p1'] });
    prisma.product.findMany.mockResolvedValue([row('p1', 'cat-1')]);

    const result = await service.search('moda-chic', 'vestdo');

    expect(searcher.search).toHaveBeenCalledWith('loja-1', 'vestdo');
    expect(result.match).toBe('similar');
    expect(result.products.map((product) => product.id)).toEqual(['p1']);
  });

  it('procura o produto sempre dentro da loja (isolamento entre lojas)', async () => {
    prisma.product.findFirst.mockResolvedValue(null);

    await expect(
      service.getProduct('moda-chic', 'produto-de-outra-loja'),
    ).rejects.toBeInstanceOf(NotFoundException);

    const { where } = prisma.product.findFirst.mock.calls[0][0];
    expect(where).toEqual({
      id: 'produto-de-outra-loja',
      storeId: 'loja-1',
      isActive: true,
    });
  });

  it('conta os produtos ativos de cada categoria', async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: 'c1', name: 'Vestidos', _count: { products: 3 } },
    ]);

    await expect(service.listCategories('moda-chic')).resolves.toEqual([
      { id: 'c1', name: 'Vestidos', productCount: 3 },
    ]);
  });
});
