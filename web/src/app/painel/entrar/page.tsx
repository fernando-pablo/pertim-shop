import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForms } from '@/components/panel/login-forms';
import { PanelSkeleton } from '@/components/panel/panel-skeleton';
import { getStores, publicApiUrl } from '@/lib/api';

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
  const { sessao } = await searchParams;
  const stores = await getStores();
  return (
    <LoginForms
      apiUrl={publicApiUrl()}
      demoStores={stores.filter((store) => store.isDemo)}
      expired={sessao === 'expirou'}
    />
  );
}
