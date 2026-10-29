import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { passThroughCache } from '../../test/fakes/fake-redis';
import { CatalogCache } from '../cache/catalog-cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { StoresService } from '../stores/stores.service';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  const prisma = {
    category: { findMany: jest.fn() },
    product: { findMany: jest.fn(), findFirst: jest.fn() },
  };
  const stores = { findActiveBySlug: jest.fn() };
  const cache = { ...passThroughCache, catalog: jest.fn() };
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
    await service.listProducts('moda-chic', { search: 'linho' });
    await service.listProducts('moda-chic', { category: 'cat-1' });
    expect(cache.catalog).not.toHaveBeenCalled();
    expect(prisma.product.findMany).toHaveBeenCalledTimes(3);
  });

  it('aplica o filtro de categoria e a busca por texto', async () => {
    prisma.product.findMany.mockResolvedValue([]);

    await service.listProducts('moda-chic', {
      category: 'cat-1',
      search: 'linho',
    });

    const { where } = prisma.product.findMany.mock.calls[0][0];
    expect(where.categoryId).toBe('cat-1');
    expect(where.OR).toHaveLength(2);
    expect(where.OR[0].name).toEqual({
      contains: 'linho',
      mode: 'insensitive',
    });
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
