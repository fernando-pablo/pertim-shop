import { Prisma } from '../generated/prisma/client';
import { OrderDto, OrderItemAddonDto } from './dto/order.dto';

export const orderInclude = {
  items: { orderBy: { position: 'asc' } },
} satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

export function toOrderDto(order: OrderWithItems): OrderDto {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    fulfillment: order.fulfillment,
    address: order.address,
    notes: order.notes,
    subtotalCents: order.subtotalCents,
    totalCents: order.totalCents,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: item.totalCents,
      addons: item.addons as unknown as OrderItemAddonDto[],
      notes: item.notes,
    })),
  };
}
