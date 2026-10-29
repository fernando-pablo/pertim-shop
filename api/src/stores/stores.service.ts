import { Injectable, NotFoundException } from '@nestjs/common';
import { CatalogCache } from '../cache/catalog-cache.service';
import { Prisma, Store } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreDto, StoreSummaryDto } from './dto/store.dto';
import { StoreTheme } from './dto/store-theme.dto';

/** O que as rotas públicas precisam saber de uma loja. */
export type PublicStore = Pick<
  Store,
  | 'id'
  | 'slug'
  | 'name'
  | 'segment'
  | 'description'
  | 'whatsapp'
  | 'theme'
  | 'isDemo'
>;

const publicStoreSelect = {
  id: true,
  slug: true,
  name: true,
  segment: true,
  description: true,
  whatsapp: true,
  theme: true,
  isDemo: true,
} satisfies Prisma.StoreSelect;

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CatalogCache,
  ) {}

  /** Lojas ativas da plataforma, em ordem alfabética. */
  list(): Promise<StoreSummaryDto[]> {
    return this.cache.storeList(async () => {
      const stores = await this.prisma.store.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: publicStoreSelect,
      });
      return stores.map((store) => toSummary(store));
    });
  }

  /** Dados públicos de uma loja ativa. */
  async getBySlug(slug: string): Promise<StoreDto> {
    const store = await this.findActiveBySlug(slug);
    return Object.assign(toSummary(store), { whatsapp: store.whatsapp });
  }

  /** Dados da loja pelo id (usado no painel, com o id que vem do login). */
  async getById(id: string): Promise<StoreDto> {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }
    return Object.assign(toSummary(store), { whatsapp: store.whatsapp });
  }

  /**
   * Busca a loja pelo endereço. Usado também pelo catálogo: tudo o que é
   * público começa pela loja, e daí em diante as consultas filtram pelo id
   * dela. É assim que uma loja nunca enxerga os dados de outra.
   *
   * Fica no cache, porque toda requisição da vitrine passa por aqui.
   * Endereço que não existe não vai para o cache (dá erro antes).
   */
  findActiveBySlug(slug: string): Promise<PublicStore> {
    return this.cache.store(slug, async () => {
      const store = await this.prisma.store.findFirst({
        where: { slug, isActive: true },
        select: publicStoreSelect,
      });
      if (!store) {
        throw new NotFoundException('Loja não encontrada');
      }
      return store;
    });
  }
}

function toSummary(store: PublicStore): StoreSummaryDto {
  return {
    slug: store.slug,
    name: store.name,
    segment: store.segment,
    description: store.description,
    theme: store.theme as unknown as StoreTheme,
    isDemo: store.isDemo,
  };
}
