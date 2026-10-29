import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CategoriesManager } from '@/components/panel/categories-manager';
import { PanelHeader } from '@/components/panel/panel-header';
import { PanelSkeleton } from '@/components/panel/panel-skeleton';
import { getSession } from '@/lib/panel-api';
import { getPanelCategories } from '@/lib/panel-catalog-api';

export const metadata: Metadata = { title: 'Categorias' };

/** Categorias da loja: as seções da vitrine (ex.: Lanches, Bebidas). */
export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-6">
          <PanelSkeleton label="Carregando as categorias" />
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}

async function CategoriesContent() {
  const [session, categories] = await Promise.all([
    getSession(),
    getPanelCategories(),
  ]);
  return (
    <>
      <PanelHeader session={session} current="categorias" />
      <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-6">
        <div>
          <h1 className="text-3xl font-extrabold">Categorias</h1>
          <p className="text-sm text-muted">
            São as seções da loja, como “Lanches” e “Bebidas”.
          </p>
        </div>
        <CategoriesManager categories={categories} />
      </main>
    </>
  );
}
