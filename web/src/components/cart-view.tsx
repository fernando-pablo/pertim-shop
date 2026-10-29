'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cartTotal, MAX_QUANTITY, removeItem, setQuantity } from '@/lib/cart';
import { useCart, useHydrated } from '@/lib/cart-store';
import { formatBRL } from '@/lib/money';
import type { OrderCreated } from '@/lib/types';
import { CheckoutForm } from './checkout-form';
import { TrashIcon } from './icons';
import { OrderSent } from './order-sent';
import { QuantityStepper } from './quantity-stepper';

export interface CartStore {
  slug: string;
  name: string;
}

/** Carrinho: itens, quantidades, total e o formulário para finalizar. */
export function CartView({
  store,
  apiUrl,
}: {
  store: CartStore;
  apiUrl: string;
}) {
  const hydrated = useHydrated();
  const [cart, updateCart] = useCart(store.slug);
  const [sent, setSent] = useState<OrderCreated | null>(null);

  if (sent) return <OrderSent store={store} result={sent} />;
  if (!hydrated)
    return (
      <p className="py-10 text-center text-muted">Carregando o carrinho…</p>
    );

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="font-heading text-2xl font-semibold">
          Seu carrinho está vazio
        </p>
        <Link
          href={`/${store.slug}`}
          className="rounded-store bg-primary px-6 py-3 font-bold text-on-primary no-underline"
        >
          Ver os produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl font-semibold">Seu carrinho</h1>
      <ul className="flex flex-col rounded-store bg-surface">
        {cart.map((item) => (
          <li
            key={item.key}
            className="flex flex-col gap-3 border-b border-line p-4 last:border-b-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">{item.productName}</span>
                {item.variantName && (
                  <span className="text-sm text-muted">{item.variantName}</span>
                )}
                {item.addonNames.length > 0 && (
                  <span className="text-sm text-muted">
                    + {item.addonNames.join(', ')}
                  </span>
                )}
                {item.notes && (
                  <span className="text-sm text-muted">Obs.: {item.notes}</span>
                )}
              </div>
              <button
                type="button"
                aria-label={`Tirar ${item.productName} do carrinho`}
                onClick={() =>
                  updateCart((current) => removeItem(current, item.key))
                }
                className="flex size-11 shrink-0 items-center justify-center rounded-store text-muted"
              >
                <TrashIcon size={20} />
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <QuantityStepper
                label={`Quantidade de ${item.productName}`}
                value={item.quantity}
                max={MAX_QUANTITY}
                onChange={(quantity) =>
                  updateCart((current) =>
                    setQuantity(current, item.key, quantity),
                  )
                }
              />
              <span className="font-bold">
                {formatBRL(item.unitPriceCents * item.quantity)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="flex items-center justify-between text-lg font-bold">
        <span>Total</span>
        <span className="text-primary">{formatBRL(cartTotal(cart))}</span>
      </p>
      <CheckoutForm
        slug={store.slug}
        apiUrl={apiUrl}
        cart={cart}
        onSent={(result) => {
          updateCart(() => []);
          setSent(result);
        }}
      />
    </div>
  );
}
