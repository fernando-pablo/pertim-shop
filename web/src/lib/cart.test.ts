import { describe, expect, it } from 'vitest';
import {
  addItem,
  cartCount,
  cartTotal,
  itemKey,
  MAX_QUANTITY,
  type NewCartItem,
  parseCart,
  removeItem,
  setQuantity,
} from './cart';

const burger: NewCartItem = {
  productId: 'p1',
  variantId: null,
  addonIds: ['bacon'],
  notes: '',
  quantity: 1,
  productName: 'Burger Trem Bão',
  variantName: null,
  addonNames: ['Bacon'],
  unitPriceCents: 3690,
};

describe('carrinho', () => {
  it('o mesmo item escolhido de novo só soma a quantidade', () => {
    let cart = addItem([], burger);
    cart = addItem(cart, { ...burger, quantity: 2 });

    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(3);
  });

  it('adicionais ou observação diferentes viram itens separados', () => {
    let cart = addItem([], burger);
    cart = addItem(cart, { ...burger, addonIds: [], addonNames: [] });
    cart = addItem(cart, { ...burger, notes: 'sem cebola' });

    expect(cart).toHaveLength(3);
  });

  it('a ordem dos adicionais não importa', () => {
    expect(itemKey({ ...burger, addonIds: ['a', 'b'] })).toBe(
      itemKey({ ...burger, addonIds: ['b', 'a'] }),
    );
  });

  it('a quantidade fica entre 1 e o máximo que a API aceita', () => {
    const cart = addItem([], burger);
    const key = cart[0].key;

    expect(setQuantity(cart, key, 0)[0].quantity).toBe(1);
    expect(setQuantity(cart, key, 999)[0].quantity).toBe(MAX_QUANTITY);
  });

  it('remove o item e soma quantidade e total', () => {
    let cart = addItem([], { ...burger, quantity: 2 });
    cart = addItem(cart, { ...burger, productId: 'p2', unitPriceCents: 1190 });

    expect(cartCount(cart)).toBe(3);
    expect(cartTotal(cart)).toBe(3690 * 2 + 1190);
    expect(removeItem(cart, cart[0].key)).toHaveLength(1);
  });

  it('carrinho salvo estragado vira carrinho vazio', () => {
    expect(parseCart(null)).toEqual([]);
    expect(parseCart('não é json')).toEqual([]);
    expect(parseCart('{"a":1}')).toEqual([]);
    expect(parseCart(JSON.stringify([{ key: 'x' }]))).toEqual([]);

    const saved = addItem([], burger);
    expect(parseCart(JSON.stringify(saved))).toEqual(saved);
  });
});
