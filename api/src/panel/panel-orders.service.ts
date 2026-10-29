import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CatalogCache } from '../cache/catalog-cache.service';
import { Prisma } from '../generated/prisma/client';
import { OrderStatus } from '../generated/prisma/enums';
import { OrderDto } from '../orders/dto/order.dto';
import { orderInclude, toOrderDto } from '../orders/order.mapper';
import { canChangeStatus, STATUS_LABELS } from '../orders/order-status';
import { PrismaService } from '../prisma/prisma.service';
import { ListOrdersQuery, PaginatedOrdersDto } from './dto/panel-order.dto';

/** Pedidos da loja do lojista logado. Todo acesso filtra pelo storeId. */
@Injectable()
export class PanelOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CatalogCache,
  ) {}

  async list(
    storeId: string,
    query: ListOrdersQuery,
  ): Promise<PaginatedOrdersDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.OrderWhereInput = {
      storeId,
      ...(query.status && { status: query.status }),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { number: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((order) => toOrderDto(order)),
      page,
      pageSize,
      total,
    };
  }

  async get(storeId: string, id: string): Promise<OrderDto> {
    const order = await this.prisma.order.findFirst({
      where: { id, storeId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return toOrderDto(order);
  }

  /**
   * Muda o status seguindo o fluxo permitido. Ao cancelar, o estoque
   * reservado pelo pedido volta para a loja.
   */
  async updateStatus(
    storeId: string,
    id: string,
    status: OrderStatus,
  ): Promise<OrderDto> {
    const order = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findFirst({
        where: { id, storeId },
        include: orderInclude,
      });
      if (!current) throw new NotFoundException('Pedido não encontrado');

      if (!canChangeStatus(current.status, status)) {
        throw new BadRequestException(
          `Não dá para mudar de "${STATUS_LABELS[current.status]}" para "${STATUS_LABELS[status]}"`,
        );
      }

      if (status === 'CANCELED') {
        for (const item of current.items) {
          if (!item.variantId) continue;
          // Só devolve para variações que controlam estoque (stock não vazio).
          await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { not: null } },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: { status },
        include: orderInclude,
      });
    });

    // O estoque voltou: a vitrine precisa mostrar o produto disponível.
    if (status === 'CANCELED') {
      await this.cache.invalidateStore(storeId);
    }
    return toOrderDto(order);
  }
}
