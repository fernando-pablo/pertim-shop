import { OrderStatus } from '../generated/prisma/enums';

/**
 * Para onde cada status pode ir. Evita, por exemplo, reabrir um pedido
 * concluído ou cancelado.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['CONFIRMED', 'CANCELED'],
  CONFIRMED: ['PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'CANCELED'],
  PREPARING: ['READY', 'OUT_FOR_DELIVERY', 'CANCELED'],
  READY: ['OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELED'],
  OUT_FOR_DELIVERY: ['COMPLETED', 'CANCELED'],
  COMPLETED: [],
  CANCELED: [],
};

export function canChangeStatus(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Nomes em português, para mensagens. */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'Novo',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  READY: 'Pronto',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
};
