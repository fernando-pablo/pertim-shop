import type { Cart } from './cart';
import type { Fulfillment } from './types';

/** Dados que o cliente preenche para finalizar o pedido. */
export interface CheckoutForm {
  customerName: string;
  customerPhone: string;
  fulfillment: Fulfillment;
  address: string;
  notes: string;
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Formata o telefone enquanto o cliente digita: "(38) 99999-0000". */
export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  const split = rest.length > 8 ? 5 : 4;
  if (rest.length <= split) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/**
 * Monta o pedido no formato da API. Vai só o que o cliente escolheu: os
 * preços a API busca no banco (ninguém consegue mudar o preço pelo navegador).
 */
export function buildOrderPayload(cart: Cart, form: CheckoutForm) {
  const notes = form.notes.trim();
  return {
    customerName: form.customerName.trim(),
    customerPhone: onlyDigits(form.customerPhone),
    fulfillment: form.fulfillment,
    ...(form.fulfillment === 'DELIVERY' && { address: form.address.trim() }),
    ...(notes && { notes }),
    items: cart.map((item) => ({
      productId: item.productId,
      ...(item.variantId && { variantId: item.variantId }),
      quantity: item.quantity,
      ...(item.addonIds.length > 0 && { addonIds: item.addonIds }),
      ...(item.notes && { notes: item.notes }),
    })),
  };
}

/** Confere o formulário antes de enviar. Devolve a primeira mensagem de erro. */
export function validateCheckout(form: CheckoutForm): string | null {
  if (form.customerName.trim().length < 2) return 'Informe o seu nome';
  const phone = onlyDigits(form.customerPhone);
  if (phone.length < 10 || phone.length > 11) {
    return 'Informe o telefone com DDD';
  }
  if (form.fulfillment === 'DELIVERY' && form.address.trim().length < 5) {
    return 'Informe o endereço de entrega';
  }
  return null;
}

/** Transforma a resposta de erro da API numa frase para o cliente. */
export function apiErrorMessage(
  status: number,
  body: unknown,
  fallback = 'Não foi possível enviar o pedido. Tente de novo.',
): string {
  const message =
    typeof body === 'object' && body !== null && 'message' in body
      ? (body as { message: unknown }).message
      : undefined;
  if (typeof message === 'string' && message) return message;
  if (Array.isArray(message) && message.length > 0) return String(message[0]);
  if (status === 429)
    return 'Muitas tentativas. Espere um pouco e tente de novo.';
  return fallback;
}
