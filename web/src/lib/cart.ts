/**
 * Carrinho: funções "puras" (sem tela e sem navegador), fáceis de testar.
 * Os preços aqui servem só para mostrar o total ao cliente: quem calcula o
 * valor de verdade é a API, com os preços do banco.
 */

export const MAX_QUANTITY = 50;

export interface CartItem {
  /** Identifica a combinação produto + opção + adicionais + observação */
  key: string;
  productId: string;
  variantId: string | null;
  addonIds: string[];
  notes: string;
  quantity: number;
  productName: string;
  variantName: string | null;
  addonNames: string[];
  /** Preço de 1 unidade, com os adicionais */
  unitPriceCents: number;
}

export type Cart = CartItem[];
export type NewCartItem = Omit<CartItem, 'key'>;

export function itemKey(item: {
  productId: string;
  variantId: string | null;
  addonIds: string[];
  notes: string;
}): string {
  return [
    item.productId,
    item.variantId ?? '',
    [...item.addonIds].sort().join(','),
    item.notes.trim().toLowerCase(),
  ].join('|');
}

function clampQuantity(quantity: number): number {
  return Math.min(Math.max(Math.round(quantity), 1), MAX_QUANTITY);
}

/** Adiciona ao carrinho. O mesmo item escolhido de novo só soma a quantidade. */
export function addItem(cart: Cart, item: NewCartItem): Cart {
  const key = itemKey(item);
  const existing = cart.find((line) => line.key === key);
  if (existing) {
    return setQuantity(cart, key, existing.quantity + item.quantity);
  }
  return [
    ...cart,
    {
      ...item,
      notes: item.notes.trim(),
      key,
      quantity: clampQuantity(item.quantity),
    },
  ];
}

export function setQuantity(cart: Cart, key: string, quantity: number): Cart {
  return cart.map((line) =>
    line.key === key ? { ...line, quantity: clampQuantity(quantity) } : line,
  );
}

export function removeItem(cart: Cart, key: string): Cart {
  return cart.filter((line) => line.key !== key);
}

export function cartCount(cart: Cart): number {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartTotal(cart: Cart): number {
  return cart.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0,
  );
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.key === 'string' &&
    typeof item.productId === 'string' &&
    (item.variantId === null || typeof item.variantId === 'string') &&
    Array.isArray(item.addonIds) &&
    Array.isArray(item.addonNames) &&
    typeof item.notes === 'string' &&
    typeof item.productName === 'string' &&
    Number.isInteger(item.quantity) &&
    Number.isInteger(item.unitPriceCents)
  );
}

/** Lê o carrinho salvo no navegador. Qualquer coisa estranha vira carrinho vazio. */
export function parseCart(raw: string | null): Cart {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isCartItem) : [];
  } catch {
    return [];
  }
}
