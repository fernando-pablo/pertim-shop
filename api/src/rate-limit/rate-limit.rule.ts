/** Regra de limite de tentativas de uma rota. */
export interface RateLimitRule {
  /** Nome da regra, usado na chave do Redis. Ex.: "login" */
  name: string;
  /** Quantas tentativas cabem na janela de tempo */
  limit: number;
  /** Tamanho da janela, em segundos */
  windowSeconds: number;
}

/** "Etiqueta" onde o decorator guarda a regra para o guard ler. */
export const RATE_LIMIT_RULE = Symbol('RATE_LIMIT_RULE');
