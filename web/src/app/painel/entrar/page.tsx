import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForms } from '@/components/panel/login-forms';
import { PanelSkeleton } from '@/components/panel/panel-skeleton';
import { getStores, publicApiUrl } from '@/lib/api';
import { isUuid } from '@/lib/panel-api';

export const metadata: Metadata = { title: 'Entrar' };

/** Tela de entrada do painel. */
export default function SignInPage(props: PageProps<'/painel/entrar'>) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="w-fit text-sm font-bold tracking-widest text-accent-ink uppercase no-underline"
        >
          Pertim Shop
        </Link>
        <h1 className="text-4xl leading-tight font-extrabold">
          Área do lojista
        </h1>
        <p className="text-muted">
          Receba os pedidos da sua loja e acompanhe cada um, do novo ao
          concluído.
        </p>
      </header>
      <Suspense fallback={<PanelSkeleton label="Carregando" />}>
        <SignInContent {...props} />
      </Suspense>
    </main>
  );
}

async function SignInContent({ searchParams }: PageProps<'/painel/entrar'>) {
  const { sessao, loja, pedido } = await searchParams;
  const stores = await getStores();
  const demoStores = stores.filter((store) => store.isDemo);
  // Vindo da simulação do pedido: a loja do pedido aparece primeiro, e
  // depois de entrar o painel abre direto nesse pedido.
  const highlight = demoStores.find((store) => store.slug === loja);
  const next =
    highlight && typeof pedido === 'string' && isUuid(pedido)
      ? `/painel/pedidos/${pedido}`
      : undefined;
  return (
    <LoginForms
      apiUrl={publicApiUrl()}
      demoStores={
        highlight
          ? [highlight, ...demoStores.filter((store) => store !== highlight)]
          : demoStores
      }
      highlight={highlight?.slug}
      next={next}
      expired={sessao === 'expirou'}
    />
  );
}
