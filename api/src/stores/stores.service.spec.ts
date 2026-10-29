import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { passThroughCache } from '../../test/fakes/fake-redis';
import { CatalogCache } from '../cache/catalog-cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { StoresService } from './stores.service';

describe('StoresService', () => {
  const prisma = { store: { findFirst: jest.fn(), findMany: jest.fn() } };
  let service: StoresService;

  const store = {
    id: 'loja-1',
    slug: 'moda-chic',
    name: 'Moda Chic',
    segment: 'CLOTHING',
    description: 'Moda feminina',
    whatsapp: '5500000000001',
    theme: { mode: 'light' },
    isDemo: true,
    isActive: true,
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        StoresService,
        { provide: PrismaService, useValue: prisma },
        { provide: CatalogCache, useValue: passThroughCache },
      ],
    }).compile();
    service = moduleRef.get(StoresService);
  });

  it('devolve os dados públicos da loja, sem o id interno', async () => {
    prisma.store.findFirst.mockResolvedValue(store);

    const result = await service.getBySlug('moda-chic');

    expect(result).toEqual({
      slug: 'moda-chic',
      name: 'Moda Chic',
      segment: 'CLOTHING',
      description: 'Moda feminina',
      theme: { mode: 'light' },
      whatsapp: '5500000000001',
      isDemo: true,
    });
  });

  it('só encontra lojas ativas', async () => {
    prisma.store.findFirst.mockResolvedValue(null);

    await expect(service.getBySlug('loja-desativada')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.store.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'loja-desativada', isActive: true },
      }),
    );
  });

  it('a lista de lojas diz quais são de demonstração (usado no painel)', async () => {
    prisma.store.findMany.mockResolvedValue([store]);

    const [summary] = await service.list();

    expect(summary).toEqual({
      slug: 'moda-chic',
      name: 'Moda Chic',
      segment: 'CLOTHING',
      description: 'Moda feminina',
      theme: { mode: 'light' },
      isDemo: true,
    });
    expect(summary).not.toHaveProperty('whatsapp');
  });
});
