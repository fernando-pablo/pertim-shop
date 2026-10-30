/**
 * Botão "Quero um sistema assim": abre o WhatsApp da Lychnos Tech com a
 * mensagem pronta. O número fica na variável de ambiente CONTACT_WHATSAPP,
 * fora do código (o repositório é público).
 */

export const CONTACT_MESSAGE =
  'Olá! Vi o Pertim Shop e quero um sistema assim para a minha loja.';

/** Para onde vai o botão enquanto o número não foi configurado. */
export const PORTFOLIO_URL = 'https://lychnos-portfolio.vercel.app';

/**
 * Link do WhatsApp. Aceita o número com ou sem o 55 do Brasil e com
 * qualquer pontuação: "(38) 99999-0000" vira "5538999990000".
 * Número ausente ou estranho: vai para o portfólio.
 */
export function contactUrl(phone: string | undefined): string {
  let digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.length < 12 || digits.length > 15) return PORTFOLIO_URL;
  return `https://wa.me/${digits}?text=${encodeURIComponent(CONTACT_MESSAGE)}`;
}
