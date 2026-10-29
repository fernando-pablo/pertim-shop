'use server';

import { refresh } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import { isOrderStatus } from '@/lib/order-status';
import { isUuid, PanelApiError, updateOrderStatus } from '@/lib/panel-api';
import { resetDemoStore } from '@/lib/panel-catalog-api';
import {
  SESSION_COOKIE,
  SESSION_PATH,
  tokenExpiresAt,
} from '@/lib/session-token';

/**
 * Ações do painel (Server Actions). Rodam no servidor da vitrine; o
 * navegador só chama. O Next.js confere a origem do pedido, o que protege
 * contra um site falso disparando essas ações (CSRF).
 */

type ActionResult = { error: string } | undefined;

/**
 * Guarda o login num cookie que o JavaScript da página não lê (httpOnly).
 * O login em si acontece no navegador, direto na API, para o limite de
 * tentativas contar o IP de cada pessoa. Aqui o token é conferido de novo
 * na API antes de virar cookie.
 */
export async function startSession(
  token: unknown,
  next?: unknown,
): Promise<ActionResult> {
  const failed = { error: 'Não foi possível entrar. Tente de novo.' };
  if (typeof token !== 'string' || token.length > 2000) return failed;
  const expiresAt = tokenExpiresAt(token);
  if (!expiresAt || expiresAt <= Date.now()) return failed;

  const check = await fetch(`${apiUrl()}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!check?.ok) return failed;

  // Em produção o site é HTTPS: o cookie só viaja por conexão segura.
  const https = (await headers()).get('x-forwarded-proto') === 'https';
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: https,
    sameSite: 'lax',
    path: SESSION_PATH,
    expires: new Date(expiresAt),
  });
  redirect(safeNext(next));
}

/**
 * Depois de entrar, abre o pedido que veio no link (vindo da simulação do
 * pedido na loja de demonstração). Só aceita endereços do próprio painel.
 */
function safeNext(next: unknown): string {
  const path = typeof next === 'string' ? next : '';
  const orderPage = /^\/painel\/pedidos\/([0-9a-f-]{36})$/i.exec(path);
  return orderPage && isUuid(orderPage[1]) ? path : '/painel';
}

export async function signOut(): Promise<void> {
  (await cookies()).delete({ name: SESSION_COOKIE, path: SESSION_PATH });
  redirect('/painel/entrar');
}

/** Muda a situação do pedido e atualiza a tela. */
export async function changeOrderStatus(
  orderId: unknown,
  status: unknown,
): Promise<ActionResult> {
  if (typeof orderId !== 'string' || !isUuid(orderId)) {
    return { error: 'Pedido não encontrado.' };
  }
  if (!isOrderStatus(status)) return { error: 'Situação inválida.' };

  try {
    await updateOrderStatus(orderId, status);
  } catch (error) {
    // Erro explicado pela API vira mensagem. Login vencido (redirect) e
    // outros erros seguem adiante.
    if (error instanceof PanelApiError) return { error: error.message };
    throw error;
  }
  refresh();
  return undefined;
}

/**
 * Volta a loja de demonstração ao original (a API recusa nas lojas de
 * verdade) e abre a lista de pedidos, que agora está vazia.
 */
export async function resetDemo(): Promise<ActionResult> {
  try {
    await resetDemoStore();
  } catch (error) {
    if (error instanceof PanelApiError) return { error: error.message };
    throw error;
  }
  redirect('/painel?restaurado=1');
}
