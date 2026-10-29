import type { Fulfillment, OrderStatus } from './types';

/** Nome de cada situação do pedido. */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'Novo',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  READY: 'Pronto',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
};

/** Ordem dos filtros na lista de pedidos. */
export const STATUS_FILTERS = Object.keys(STATUS_LABELS) as OrderStatus[];

/**
 * Para onde cada situação pode ir. É a mesma regra da API
 * (api/src/orders/order-status.ts): a API confere de novo, isto aqui só
 * decide quais botões aparecem.
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

/** Texto do botão que leva o pedido para cada situação. */
export const ACTION_LABELS: Record<OrderStatus, string> = {
  NEW: 'Novo',
  CONFIRMED: 'Confirmar pedido',
  PREPARING: 'Começar o preparo',
  READY: 'Marcar como pronto',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  COMPLETED: 'Concluir pedido',
  CANCELED: 'Cancelar pedido',
};

/** Cores de cada situação (fundo claro e texto escuro, bom contraste). */
export const STATUS_STYLES: Record<OrderStatus, string> = {
  NEW: 'bg-amber-200 text-amber-950',
  CONFIRMED: 'bg-sky-100 text-sky-900',
  PREPARING: 'bg-orange-100 text-orange-900',
  READY: 'bg-green-100 text-green-900',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-900',
  COMPLETED: 'bg-stone-200 text-stone-700',
  CANCELED: 'bg-red-100 text-red-900',
};

/** Confere um texto que veio de fora (ex.: ?status= na URL). */
export function isOrderStatus(value: unknown): value is OrderStatus {
  return STATUS_FILTERS.includes(value as OrderStatus);
}

/** O caminho mais comum de cada pedido: vira o botão principal. */
function mainStep(
  status: OrderStatus,
  fulfillment: Fulfillment,
): OrderStatus | null {
  switch (status) {
    case 'NEW':
      return 'CONFIRMED';
    case 'CONFIRMED':
      return 'PREPARING';
    case 'PREPARING':
      return 'READY';
    case 'READY':
      return fulfillment === 'DELIVERY' ? 'OUT_FOR_DELIVERY' : 'COMPLETED';
    case 'OUT_FOR_DELIVERY':
      return 'COMPLETED';
    default:
      return null;
  }
}

export interface NextSteps {
  /** Botão principal (ou null se o pedido já terminou) */
  main: OrderStatus | null;
  /** Atalhos, como pular o preparo */
  others: OrderStatus[];
  canCancel: boolean;
}

/**
 * Botões do pedido. "Saiu para entrega" não aparece em pedido de retirada,
 * e cancelar fica separado (pede confirmação).
 */
export function nextSteps(
  status: OrderStatus,
  fulfillment: Fulfillment,
): NextSteps {
  const allowed = ORDER_TRANSITIONS[status];
  const main = mainStep(status, fulfillment);
  const others = allowed.filter(
    (next) =>
      next !== main &&
      next !== 'CANCELED' &&
      !(next === 'OUT_FOR_DELIVERY' && fulfillment === 'PICKUP'),
  );
  return { main, others, canCancel: allowed.includes('CANCELED') };
}
