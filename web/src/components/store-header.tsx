import Link from 'next/link';
import type { Store } from '@/lib/types';
import { CartButton } from './cart-links';
import { BackIcon } from './icons';
import { StoreLogo } from './store-theme';

/** Topo das páginas da loja: logo, nome e carrinho (ou botão de voltar). */
export function StoreHeader({
  store,
  backHref,
  backLabel,
  showCart = true,
}: {
  store: Store;
  backHref?: string;
  backLabel?: string;
  showCart?: boolean;
}) {
  return (
    <>
      {store.isDemo && (
        <p className="bg-ink px-4 py-1.5 text-center text-xs font-medium text-bg">
          Loja de demonstração: os pedidos são simulados.
        </p>
      )}
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {backHref && (
            <Link
              href={backHref}
              aria-label={backLabel ?? 'Voltar'}
              className="flex size-11 shrink-0 items-center justify-center rounded-store text-ink"
            >
              <BackIcon />
            </Link>
          )}
          <Link
            href={`/${store.slug}`}
            className="flex min-w-0 items-center gap-3 text-ink no-underline"
          >
            <StoreLogo store={store} />
            <span className="truncate font-heading text-2xl leading-none font-semibold">
              {store.name}
            </span>
          </Link>
        </div>
        {showCart && <CartButton slug={store.slug} />}
      </header>
    </>
  );
}

/** Rodapé com a marca da plataforma. */
export function StoreFooter() {
  return (
    <footer className="px-4 pt-10 pb-28 text-center text-xs text-muted">
      Feito com{' '}
      <Link href="/" className="font-semibold text-muted underline">
        Pertim Shop
      </Link>
      . Tudo pertim d&apos;ocê.
    </footer>
  );
}
