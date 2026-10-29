'use client';

import Link from 'next/link';
import { cartCount, cartTotal } from '@/lib/cart';
import { useCart } from '@/lib/cart-store';
import { formatBRL } from '@/lib/money';
import { BagIcon } from './icons';

/** Botão do carrinho no topo, com a quantidade de itens. */
export function CartButton({ slug }: { slug: string }) {
  const [cart] = useCart(slug);
  const count = cartCount(cart);
  return (
    <Link
      href={`/${slug}/carrinho`}
      aria-label={count ? `Carrinho com ${count} itens` : 'Carrinho vazio'}
      className="relative flex size-11 items-center justify-center rounded-store bg-surface text-ink shadow-sm"
    >
      <BagIcon />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-on-primary">
          {count}
        </span>
      )}
    </Link>
  );
}

/** Barra fixa no rodapé, que aparece quando o carrinho tem itens. */
export function CartBar({ slug }: { slug: string }) {
  const [cart] = useCart(slug);
  const count = cartCount(cart);
  if (count === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 px-4 pb-4">
      <Link
        href={`/${slug}/carrinho`}
        className="mx-auto flex h-14 max-w-3xl items-center justify-between rounded-store bg-primary px-5 font-semibold text-on-primary shadow-lg"
      >
        <span>
          Ver carrinho · {count} {count === 1 ? 'item' : 'itens'}
        </span>
        <span>{formatBRL(cartTotal(cart))}</span>
      </Link>
    </div>
  );
}
