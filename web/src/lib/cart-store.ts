'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { type Cart, parseCart } from './cart';

/**
 * O carrinho fica salvo no navegador (localStorage), um por loja. Assim ele
 * continua lá se o cliente fechar a página, e não precisa de login.
 */

const EMPTY: Cart = [];
const listeners = new Set<() => void>();
const snapshots = new Map<string, { raw: string | null; cart: Cart }>();

const storageKey = (slug: string) => `pertim:carrinho:${slug}`;

function readCart(slug: string): Cart {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(storageKey(slug));
  } catch {
    return EMPTY;
  }
  // Devolve o mesmo objeto enquanto nada mudar (o React exige isso).
  const cached = snapshots.get(slug);
  if (cached && cached.raw === raw) return cached.cart;
  const cart = parseCart(raw);
  snapshots.set(slug, { raw, cart });
  return cart;
}

function writeCart(slug: string, cart: Cart): void {
  try {
    if (cart.length === 0) {
      window.localStorage.removeItem(storageKey(slug));
    } else {
      window.localStorage.setItem(storageKey(slug), JSON.stringify(cart));
    }
  } catch {
    // Navegador sem espaço ou em modo privado: o carrinho só não fica salvo.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Atualiza também quando o carrinho muda em outra aba.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

const noSubscribe = () => () => undefined;

/**
 * false no servidor e true no navegador. O servidor não enxerga o carrinho
 * (ele fica no navegador), então a tela do carrinho espera esse sinal para
 * não piscar "carrinho vazio".
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
}

/** O carrinho da loja e uma função para mudá-lo. */
export function useCart(slug: string) {
  const cart = useSyncExternalStore(
    subscribe,
    () => readCart(slug),
    () => EMPTY,
  );
  const update = useCallback(
    (change: (current: Cart) => Cart) =>
      writeCart(slug, change(readCart(slug))),
    [slug],
  );
  return [cart, update] as const;
}
