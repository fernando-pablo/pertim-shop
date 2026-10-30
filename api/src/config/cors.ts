/**
 * Endereços (origens) que podem chamar a API pelo navegador: o site da
 * vitrine. Vêm da variável CORS_ORIGINS, separados por vírgula, por exemplo
 * "https://pertim-shop.vercel.app".
 *
 * Vazio libera qualquer endereço, o que é prático para rodar no PC. Em
 * produção, a variável fica preenchida e outros sites são recusados.
 */
export function corsOrigins(value: string | undefined): string[] | true {
  const origins = (value ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return origins.length > 0 ? origins : true;
}
