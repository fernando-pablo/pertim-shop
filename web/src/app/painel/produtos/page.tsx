import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PanelHeader } from '@/components/panel/panel-header';
import { PanelSkeleton } from '@/components/panel/panel-skeleton';
import { ProductAdminList } from '@/components/panel/product-admin-list';
import { ResetDemo } from '@/components/panel/reset-demo';
import { getSession } from '@/lib/panel-api';
import { getPanelCategories, getPanelProducts } from '@/lib/panel-catalog-api';

export const metadata: Metadata = { title: 'Produtos' };

/** Produtos da loja: busca, pausar, destacar e link para editar. */
export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-6">
          <PanelSkeleton label="Carregando os produtos" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}

async function ProductsContent() {
  const [session, products, categories] = await Promise.all([
    getSession(),
    getPanelProducts(),
    getPanelCategories(),
  ]);

  return (
    <>
      <PanelHeader session={session} current="produtos" />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold">Produtos</h1>
          <Link
            href="/painel/produtos/novo"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary no-underline"
          >
            Novo produto
          </Link>
        </div>
        <ProductAdminList products={products} categories={categories} />
        {session.store.isDemo && <ResetDemo storeName={session.store.name} />}
      </main>
    </>
  );
}
