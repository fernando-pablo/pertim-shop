import { randomBytes } from 'node:crypto';

/** Quanto tempo uma resposta fica guardada no cache: 10 minutos. */
export const CACHE_TTL_SECONDS = 10 * 60;

const PREFIX = 'pertim';

/**
 * Nomes das chaves no Redis. Ficam todos aqui para ninguém escrever uma
 * chave "na mão" com um nome diferente.
 */
export const cacheKeys = {
  /**
   * Lista de lojas da plataforma. O "v2" troca a chave quando o formato
   * muda (a lista ganhou o isDemo): o cache antigo é ignorado na hora.
   */
  storeList: `${PREFIX}:stores:v2`,
  /** Dados públicos de uma loja, pelo endereço (slug) */
  store: (slug: string) => `${PREFIX}:store:${slug}`,
  /** Versão atual do catálogo de uma loja */
  catalogVersion: (storeId: string) => `${PREFIX}:catalog:${storeId}:version`,
  /** Uma resposta do catálogo, presa a uma versão */
  catalog: (storeId: string, version: string, name: string) =>
    `${PREFIX}:catalog:${storeId}:${version}:${name}`,
  /** Contador do limite de tentativas */
  rateLimit: (rule: string, client: string) =>
    `${PREFIX}:limit:${rule}:${client}`,
};

/** Código aleatório curto que identifica uma versão do catálogo. */
export function newCatalogVersion(): string {
  return randomBytes(6).toString('base64url');
}
