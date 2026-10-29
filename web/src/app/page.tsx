import Link from 'next/link';
import { Suspense } from 'react';
import { StoreLogo, StoreTheme } from '@/components/store-theme';
import { getStores } from '@/lib/api';
import { SEGMENT_LABELS } from '@/lib/theme';

/** Página inicial: a marca Pertim Shop e as lojas da plataforma. */
export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-bold tracking-widest text-accent-ink uppercase">
            Pertim Shop
          </p>
          <h1 className="text-4xl leading-tight font-extrabold sm:text-5xl">
            Tudo pertim d&apos;ocê.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Plataforma de pedidos para pequenos comércios. Cada loja com o seu
            link e o seu visual, e o pedido chegando pronto no WhatsApp.
          </p>
        </header>

        <section aria-labelledby="lojas" className="flex flex-col gap-4">
          <h2 id="lojas" className="text-2xl font-bold">
            Conheça as lojas
          </h2>
          <Suspense
            fallback={<p className="text-muted">Carregando as lojas…</p>}
          >
            <StoreCards />
          </Suspense>
        </section>
      </main>
      <footer className="px-4 pb-10 text-center text-sm text-muted">
        Um projeto da{' '}
        <a
          href="https://lychnos-portfolio.vercel.app"
          className="font-semibold text-muted underline"
        >
          Lychnos Tech
        </a>
        .
      </footer>
    </div>
  );
}

async function StoreCards() {
  const stores = await getStores();
  if (stores.length === 0) {
    return <p className="text-muted">Nenhuma loja por aqui ainda.</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {stores.map((store) => (
        <li key={store.slug}>
          {/* Cada cartão já mostra as cores e as fontes da própria loja. */}
          <StoreTheme store={store} className="h-full rounded-store bg-bg">
            <Link
              href={`/${store.slug}`}
              className="flex h-full items-center gap-4 rounded-store border border-line p-4 text-ink no-underline"
            >
              <StoreLogo store={store} size={52} />
              <span className="flex flex-col gap-1">
                <span className="font-heading text-2xl leading-none font-semibold">
                  {store.name}
                </span>
                <span className="text-sm text-muted">
                  {SEGMENT_LABELS[store.segment]}
                </span>
              </span>
            </Link>
          </StoreTheme>
        </li>
      ))}
    </ul>
  );
}
