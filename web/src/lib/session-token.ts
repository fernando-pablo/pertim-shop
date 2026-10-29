/**
 * Login do painel. O token JWT da API fica num cookie "httpOnly": o
 * navegador manda o cookie sozinho, mas o JavaScript da página não consegue
 * ler. Assim, um script malicioso na página não rouba o login.
 */

/** Nome do cookie que guarda o login do lojista. */
export const SESSION_COOKIE = 'pertim_painel';

/** O cookie só vai junto nas páginas do painel. */
export const SESSION_PATH = '/painel';

/** Para onde vai quem está com o login vencido. */
export const EXPIRED_URL = '/painel/entrar?sessao=expirou';

/**
 * Quando o token vence (em milissegundos), lendo o "exp" que vem dentro
 * dele. Não confere a assinatura: isso é trabalho da API. Serve só para
 * não mostrar o painel para quem já está com o login vencido.
 * Token com formato estranho devolve null.
 */
export function tokenExpiresAt(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replaceAll('-', '+').replaceAll('_', '/');
    const data: unknown = JSON.parse(atob(base64));
    const exp =
      typeof data === 'object' && data !== null && 'exp' in data
        ? data.exp
        : undefined;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const expiresAt = tokenExpiresAt(token);
  return expiresAt === null || expiresAt <= now;
}
