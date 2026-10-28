/** Quem está logado: guardado dentro do token (JWT). */
export interface AuthMerchant {
  merchantId: string;
  storeId: string;
}

/** Conteúdo do token. "sub" (subject) é o padrão do JWT para o id do usuário. */
export interface JwtPayload {
  sub: string;
  storeId: string;
}
