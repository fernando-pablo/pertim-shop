import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoresService } from '../stores/stores.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderCreatedDto } from './dto/order.dto';
import { orderInclude, toOrderDto } from './order.mapper';
import { PricedOrder, priceOrder, pricingInclude } from './order-pricing';
import { buildWhatsApp } from './whatsapp-message';

type Tx = Prisma.TransactionClient;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stores: StoresService,
  ) {}

  /**
   * Cria o pedido numa transação: ou tudo dá certo (estoque, número e
   * pedido), ou nada é gravado.
   */
  async create(slug: string, dto: CreateOrderDto): Promise<OrderCreatedDto> {
    const store = await this.stores.findActiveBySlug(slug);

    const order = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: dto.items.map((item) => item.productId) },
          storeId: store.id,
          isActive: true,
        },
        include: pricingInclude,
      });

      const priced = priceOrder(products, dto.items);
      await reserveStock(tx, priced);
      const number = await nextOrderNumber(tx, store.id);

      return tx.order.create({
        data: {
          storeId: store.id,
          number,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          fulfillment: dto.fulfillment,
          address: dto.fulfillment === 'DELIVERY' ? dto.address : null,
          notes: dto.notes || null,
          subtotalCents: priced.subtotalCents,
          totalCents: priced.subtotalCents,
          items: {
            create: priced.lines.map((line, position) => ({
              ...line,
              position,
              addons: line.addons as unknown as Prisma.InputJsonValue,
            })),
          },
        },
        include: orderInclude,
      });
    });

    const dtoOrder = toOrderDto(order);
    return {
      order: dtoOrder,
      whatsapp: buildWhatsApp(store.whatsapp, store.name, dtoOrder),
      isDemo: store.isDemo,
    };
  }
}

/**
 * Baixa o estoque só se ainda houver quantidade suficiente, num único
 * comando do banco. Se dois clientes disputarem a última unidade ao mesmo
 * tempo, só um consegue; o outro recebe "estoque insuficiente".
 */
async function reserveStock(tx: Tx, priced: PricedOrder): Promise<void> {
  for (const need of priced.stockNeeds) {
    const result = await tx.productVariant.updateMany({
      where: { id: need.variantId, stock: { gte: need.quantity } },
      data: { stock: { decrement: need.quantity } },
    });
    if (result.count === 0) {
      throw new ConflictException(`Estoque insuficiente: ${need.label}`);
    }
  }
}

/** Próximo número de pedido da loja (#1, #2...), sem repetir nem pular. */
async function nextOrderNumber(tx: Tx, storeId: string): Promise<number> {
  const store = await tx.store.update({
    where: { id: storeId },
    data: { lastOrderNumber: { increment: 1 } },
    select: { lastOrderNumber: true },
  });
  return store.lastOrderNumber;
}
