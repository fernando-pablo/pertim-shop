import { Injectable, NotFoundException } from '@nestjs/common';
import { Store } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoreDto, StoreSummaryDto } from './dto/store.dto';
import { StoreTheme } from './dto/store-theme.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lojas ativas da plataforma, em ordem alfabética. */
  async list(): Promise<StoreSummaryDto[]> {
    const stores = await this.prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return stores.map((store) => toSummary(store));
  }

  /** Dados públicos de uma loja ativa. */
  async getBySlug(slug: string): Promise<StoreDto> {
    const store = await this.findActiveBySlug(slug);
    return Object.assign(toSummary(store), {
      whatsapp: store.whatsapp,
      isDemo: store.isDemo,
    });
  }

  /** Dados da loja pelo id (usado no painel, com o id que vem do login). */
  async getById(id: string): Promise<StoreDto> {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }
    return Object.assign(toSummary(store), {
      whatsapp: store.whatsapp,
      isDemo: store.isDemo,
    });
  }

  /**
   * Busca a loja pelo endereço. Usado também pelo catálogo: tudo o que é
   * público começa pela loja, e daí em diante as consultas filtram pelo id
   * dela. É assim que uma loja nunca enxerga os dados de outra.
   */
  async findActiveBySlug(slug: string): Promise<Store> {
    const store = await this.prisma.store.findFirst({
      where: { slug, isActive: true },
    });
    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }
    return store;
  }
}

function toSummary(store: Store): StoreSummaryDto {
  return {
    slug: store.slug,
    name: store.name,
    segment: store.segment,
    description: store.description,
    theme: store.theme as unknown as StoreTheme,
  };
}
