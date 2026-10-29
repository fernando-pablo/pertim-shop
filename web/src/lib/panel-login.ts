import { apiErrorMessage } from './order';
import type { AuthResponse } from './types';

/**
 * Login no navegador, direto na API: assim o limite de tentativas conta o
 * IP de cada pessoa. Depois, o token vai para a Server Action
 * `startSession`, que guarda o cookie protegido.
 */
export type LoginOutcome = { token: string } | { error: string };

export async function loginAtApi(
  apiUrl: string,
  path: '/auth/login' | '/auth/demo-login',
  body: object,
): Promise<LoginOutcome> {
  let response: Response;
  let data: unknown;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    data = await response.json().catch(() => null);
  } catch {
    return {
      error: 'Sem conexão com a loja. Confira a internet e tente de novo.',
    };
  }
  if (!response.ok) {
    const fallback = 'Não foi possível entrar. Tente de novo.';
    return { error: apiErrorMessage(response.status, data, fallback) };
  }
  return { token: (data as AuthResponse).accessToken };
}
