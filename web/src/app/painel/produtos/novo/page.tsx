import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { BackIcon } from '@/components/icons';
import { PanelHeader } from '@/components/panel/panel-header';
import { PanelSkeleton } from '@/components/panel/panel-skeleton';
import { ProductDataForm } from '@/components/panel/product-data-form';
import { getSession } from '@/lib/panel-api';
import { getPanelCategories } from '@/lib/panel-catalog-api';

export const metadata: Metadata = { title: 'Novo produto' };

/** Produto novo: nome, descrição, preço e categoria. */
export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-6">
          <PanelSkeleton label="Carregando" />
        </div>
      }
    >
      <NewProductContent />
    </Suspense>
  );
}

async function NewProductContent() {
  const [session, categories] = await Promise.all([
    getSession(),
    getPanelCategories(),
  ]);
  return (
    <>
      <PanelHeader session={session} current="produtos" />
      <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-6">
        <div className="flex flex-col gap-2">
          <Link
            href="/painel/produtos"
            className="flex w-fit items-center gap-1 text-sm font-semibold text-ink no-underline"
          >
            <BackIcon size={18} /> Todos os produtos
          </Link>
          <h1 className="text-3xl font-extrabold">Novo produto</h1>
          <p className="text-sm text-muted">
            Sem foto por enquanto: a loja mostra um desenho no lugar. Depois de
            criar, dá para incluir adicionais.
          </p>
        </div>
        <ProductDataForm categories={categories} />
      </main>
    </>
  );
}
