import { canChangeStatus, ORDER_TRANSITIONS } from './order-status';

describe('fluxo de status do pedido', () => {
  it('segue o caminho normal de um pedido', () => {
    expect(canChangeStatus('NEW', 'CONFIRMED')).toBe(true);
    expect(canChangeStatus('CONFIRMED', 'PREPARING')).toBe(true);
    expect(canChangeStatus('PREPARING', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(canChangeStatus('OUT_FOR_DELIVERY', 'COMPLETED')).toBe(true);
  });

  it('não pula etapas nem volta atrás', () => {
    expect(canChangeStatus('NEW', 'COMPLETED')).toBe(false);
    expect(canChangeStatus('PREPARING', 'NEW')).toBe(false);
  });

  it('pedido concluído ou cancelado não muda mais', () => {
    expect(ORDER_TRANSITIONS.COMPLETED).toEqual([]);
    expect(ORDER_TRANSITIONS.CANCELED).toEqual([]);
  });

  it('dá para cancelar enquanto o pedido não foi concluído', () => {
    for (const status of [
      'NEW',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'OUT_FOR_DELIVERY',
    ] as const) {
      expect(canChangeStatus(status, 'CANCELED')).toBe(true);
    }
  });
});
