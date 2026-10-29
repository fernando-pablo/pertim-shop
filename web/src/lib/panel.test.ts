import { describe, expect, it } from 'vitest';
import { formatOrderTime } from './format-time';
import { isOrderStatus, nextSteps } from './order-status';
import { isTokenExpired, tokenExpiresAt } from './session-token';

/** Monta um JWT de teste (a assinatura não importa para a vitrine). */
function fakeToken(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '');
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.assinatura`;
}

describe('token do painel', () => {
  const exp = 1_900_000_000; // em segundos, como no JWT

  it('lê a validade que vem dentro do token', () => {
    expect(tokenExpiresAt(fakeToken({ sub: 'm1', exp }))).toBe(exp * 1000);
  });

  it('diz se o token já venceu', () => {
    const token = fakeToken({ exp });
    expect(isTokenExpired(token, exp * 1000 - 1)).toBe(false);
    expect(isTokenExpired(token, exp * 1000)).toBe(true);
  });

  it('token sem validade ou com formato estranho conta como vencido', () => {
    expect(isTokenExpired(fakeToken({ sub: 'm1' }))).toBe(true);
    expect(isTokenExpired('nao-e-um-token')).toBe(true);
    expect(isTokenExpired('a.@@@.c')).toBe(true);
  });
});

describe('botões do pedido', () => {
  it('pedido novo: confirmar ou cancelar', () => {
    expect(nextSteps('NEW', 'PICKUP')).toEqual({
      main: 'CONFIRMED',
      others: [],
      canCancel: true,
    });
  });

  it('confirmado: começar o preparo, ou pular direto para pronto', () => {
    expect(nextSteps('CONFIRMED', 'PICKUP')).toEqual({
      main: 'PREPARING',
      others: ['READY'],
      canCancel: true,
    });
    expect(nextSteps('CONFIRMED', 'DELIVERY').others).toEqual([
      'READY',
      'OUT_FOR_DELIVERY',
    ]);
  });

  it('pronto: entrega sai para entrega; retirada é concluída', () => {
    expect(nextSteps('READY', 'DELIVERY')).toMatchObject({
      main: 'OUT_FOR_DELIVERY',
      others: ['COMPLETED'],
    });
    expect(nextSteps('READY', 'PICKUP')).toMatchObject({
      main: 'COMPLETED',
      others: [],
    });
  });

  it('pedido concluído ou cancelado não tem mais botões', () => {
    for (const status of ['COMPLETED', 'CANCELED'] as const) {
      expect(nextSteps(status, 'DELIVERY')).toEqual({
        main: null,
        others: [],
        canCancel: false,
      });
    }
  });

  it('só aceita situações que existem (vindas da URL)', () => {
    expect(isOrderStatus('READY')).toBe(true);
    expect(isOrderStatus('ready')).toBe(false);
    expect(isOrderStatus('toString')).toBe(false);
    expect(isOrderStatus(undefined)).toBe(false);
  });
});

describe('horário do pedido', () => {
  // 29/10/2026, 15:00 em Brasília (18:00 UTC)
  const now = new Date('2026-10-29T18:00:00Z');

  it('pedido de agora há pouco', () => {
    expect(formatOrderTime('2026-10-29T17:59:30Z', now)).toBe('Agora');
    expect(formatOrderTime('2026-10-29T17:48:00Z', now)).toBe('Há 12 min');
  });

  it('hoje e ontem no fuso de Brasília', () => {
    expect(formatOrderTime('2026-10-29T12:05:00Z', now)).toBe('Hoje, 09:05');
    // 02:30 UTC do dia 29 ainda é dia 28 em Brasília
    expect(formatOrderTime('2026-10-29T02:30:00Z', now)).toBe('Ontem, 23:30');
  });

  it('dias anteriores mostram a data', () => {
    expect(formatOrderTime('2026-10-20T21:15:00Z', now)).toBe('20/10, 18:15');
  });
});
