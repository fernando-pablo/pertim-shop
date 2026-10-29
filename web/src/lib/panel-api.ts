import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { apiUrl } from './api';
import { apiErrorMessage } from './order';
import { EXPIRED_URL, SESSION_COOKIE } from './session-token';
import type {
  OrderStatus,
  OrdersPage,
  PanelOrder,
  PanelSession,
} from './types';

/**
 * Conversa com as rotas do painel da API. Roda só no servidor da vitrine:
 * `cookies()` não existe no navegador, então este arquivo nunca vai parar
 * no código que o cliente baixa. O token sai do cookie e vai no cabeçalho
 * "Authorization", e quem confere se ele vale é a API.
 */

/** Erro que a API explicou (ex.: mudança de situação não permitida). */
export class PanelApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function sessionToken(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect('/painel/entrar');
  return token;
}

/** 401 = login vencido ou inválido: volta para a tela de entrada. */
async function panelRequest<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await sessionToken();
  const response = await fetch(`${apiUrl()}${path}`, {
    method: init.method ?? 'GET',
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body !== undefined && { 'Content-Type': 'application/json' }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (response.status === 401) redirect(EXPIRED_URL);

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const fallback = 'Não foi possível falar com a loja. Tente de novo.';
    throw new PanelApiError(
      apiErrorMessage(response.status, body, fallback),
      response.status,
    );
  }
  return body as T;
}

/** Lojista e loja do login. O cache() evita chamar a API duas vezes. */
export const getSession = cache(() => panelRequest<PanelSession>('/auth/me'));

export function getOrders(
  status: OrderStatus | undefined,
  page: number,
): Promise<OrdersPage> {
  const query = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (status) query.set('status', status);
  return panelRequest<OrdersPage>(`/panel/orders?${query}`);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

/** Pedido da loja do lojista logado; de outra loja ou inexistente, null. */
export async function getOrder(id: string): Promise<PanelOrder | null> {
  if (!isUuid(id)) return null;
  try {
    return await panelRequest<PanelOrder>(`/panel/orders/${id}`);
  } catch (error) {
    if (error instanceof PanelApiError && error.status === 404) return null;
    throw error;
  }
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<PanelOrder> {
  return panelRequest<PanelOrder>(`/panel/orders/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}
