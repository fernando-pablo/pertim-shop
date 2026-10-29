import Link from 'next/link';
import { publicApiUrl } from '@/lib/api';
import type { Store } from '@/lib/types';
import { CartButton } from './cart-links';
import { DemoPanelButton } from './demo-panel-button';
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
        // Faixa da demonstração: o visitante vê os dois lados, a loja e o
        // painel do lojista desta loja, sem precisar fazer um pedido antes.
        <div className="bg-ink text-bg">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-1.5 text-xs">
            <p className="font-medium">
              Loja de demonstração: os pedidos são simulados.
            </p>
            <DemoPanelButton
              slug={store.slug}
              apiUrl={publicApiUrl()}
              className="rounded-full bg-bg px-3 py-1 font-bold text-ink"
            >
              Área do lojista
            </DemoPanelButton>
          </div>
        </div>
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
