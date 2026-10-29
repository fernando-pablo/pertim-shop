import { cache } from 'react';
import type {
  Category,
  ProductDetail,
  ProductSummary,
  Store,
  StoreSummary,
} from './types';

/**
 * Conversa com a API do Pertim Shop. Roda só no servidor da vitrine.
 * Não guardamos cache aqui: a API já tem o cache da vitrine no Redis,
 * então o estoque aparece sempre atualizado.
 */

/** Endereço da API para o servidor da vitrine (no Docker: http://api:3333). */
function apiUrl(): string {
  return process.env.API_URL ?? 'http://localhost:3333';
}

/** Endereço da API para o navegador do cliente (envio do pedido). */
export function publicApiUrl(): string {
  return process.env.PUBLIC_API_URL ?? apiUrl();
}

/** Busca na API. 404 vira null; outros erros mostram a tela de erro. */
async function get<T>(path: string): Promise<T | null> {
  const response = await fetch(`${apiUrl()}${path}`, { cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`A API respondeu ${response.status} em ${path}`);
  }
  return (await response.json()) as T;
}

const store = (slug: string) => `/stores/${encodeURIComponent(slug)}`;

export async function getStores(): Promise<StoreSummary[]> {
  return (await get<StoreSummary[]>('/stores')) ?? [];
}

/**
 * Dados da loja. O layout e a página pedem a mesma loja na mesma visita;
 * o cache() do React faz isso virar uma chamada só à API.
 */
export const getStore = cache((slug: string): Promise<Store | null> =>
  get<Store>(store(slug)),
);

export async function getCategories(slug: string): Promise<Category[]> {
  return (await get<Category[]>(`${store(slug)}/categories`)) ?? [];
}

export async function getProducts(
  slug: string,
  search?: string,
): Promise<ProductSummary[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return (await get<ProductSummary[]>(`${store(slug)}/products${query}`)) ?? [];
}

/** Ids que não são UUID nem chegam na API (ela responderia 400). */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getProduct(
  slug: string,
  productId: string,
): Promise<ProductDetail | null> {
  if (!UUID.test(productId)) return Promise.resolve(null);
  return get<ProductDetail>(
    `${store(slug)}/products/${encodeURIComponent(productId)}`,
  );
}
