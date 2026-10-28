import { ApiProperty } from '@nestjs/swagger';
import { Fulfillment, OrderStatus } from '../../generated/prisma/enums';

export class OrderItemAddonDto {
  name: string;
  priceCents: number;
}

/** Item do pedido, com nome e preço "congelados" no momento da compra. */
export class OrderItemDto {
  productName: string;
  variantName: string | null;
  quantity: number;
  /** Preço de 1 unidade, já com os adicionais */
  unitPriceCents: number;
  totalCents: number;
  addons: OrderItemAddonDto[];
  notes: string | null;
}

export class OrderDto {
  id: string;
  /** Número do pedido na loja: #1, #2, #3... */
  number: number;
  @ApiProperty({ enum: Object.values(OrderStatus) })
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  @ApiProperty({ enum: Object.values(Fulfillment) })
  fulfillment: Fulfillment;
  address: string | null;
  notes: string | null;
  subtotalCents: number;
  totalCents: number;
  createdAt: Date;
  items: OrderItemDto[];
}

/** Dados para mandar o pedido pelo WhatsApp da loja. */
export class WhatsAppDto {
  /** Número da loja, só dígitos */
  phone: string;
  /** Texto pronto do pedido */
  message: string;
  /** Link que abre o WhatsApp com a mensagem preenchida */
  url: string;
}

export class OrderCreatedDto {
  order: OrderDto;
  whatsapp: WhatsAppDto;
  /** Loja de demonstração: a vitrine simula o envio em vez de abrir o WhatsApp */
  isDemo: boolean;
}
