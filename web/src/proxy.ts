import { type NextRequest, NextResponse } from 'next/server';
import {
  isTokenExpired,
  SESSION_COOKIE,
  SESSION_PATH,
} from '@/lib/session-token';

/**
 * "Porteiro" do painel: roda antes da página. Sem login (ou com o login
 * vencido), manda para a tela de entrada. É só uma checagem rápida do
 * cookie; a API confere o token de verdade em cada pedido de dados.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/painel/entrar') {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && !isTokenExpired(token)) return NextResponse.next();

  const url = new URL('/painel/entrar', request.url);
  if (token) url.searchParams.set('sessao', 'expirou');
  const response = NextResponse.redirect(url);
  if (token) {
    response.cookies.delete({ name: SESSION_COOKIE, path: SESSION_PATH });
  }
  return response;
}

export const config = {
  matcher: ['/painel/:path*'],
};
