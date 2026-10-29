import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BackIcon } from '@/components/icons';
import { AddonsEditor } from '@/components/panel/addons-editor';
import { PanelHeader } from '@/components/panel/panel-header';
import { PanelSkeleton } from '@/components/panel/panel-skeleton';
import { DeleteProduct } from '@/components/panel/delete-product';
import { ProductDataForm } from '@/components/panel/product-data-form';
import { VariantsEditor } from '@/components/panel/variants-editor';
import { getSession } from '@/lib/panel-api';
import { getPanelCategories, getPanelProduct } from '@/lib/panel-catalog-api';

export const metadata: Metadata = { title: 'Editar produto' };

/** Editar um produto: dados, opções, adicionais e apagar. */
export default function EditProductPage(
  props: PageProps<'/painel/produtos/[id]'>,
) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-6">
          <PanelSkeleton label="Carregando o produto" />
        </div>
      }
    >
      <EditProductContent {...props} />
    </Suspense>
  );
}

async function EditProductContent({
  params,
  searchParams,
}: PageProps<'/painel/produtos/[id]'>) {
  const [{ id }, { novo }] = await Promise.all([params, searchParams]);
  const [session, product, categories] = await Promise.all([
    getSession(),
    getPanelProduct(id),
    getPanelCategories(),
  ]);
  if (!product) notFound();

  const sectionClass = 'flex flex-col gap-3';
  const titleClass = 'text-xl font-bold';

  return (
    <>
      <PanelHeader session={session} current="produtos" />
      <main className="mx-auto flex max-w-xl flex-col gap-8 px-4 py-6">
        <div className="flex flex-col gap-2">
          <Link
            href="/painel/produtos"
            className="flex w-fit items-center gap-1 text-sm font-semibold text-ink no-underline"
          >
            <BackIcon size={18} /> Todos os produtos
          </Link>
          <h1 className="text-3xl font-extrabold">{product.name}</h1>
          {product.isActive ? (
            <Link
              href={`/${session.store.slug}/produto/${product.id}`}
              className="w-fit text-sm font-semibold text-ink underline"
            >
              Ver na loja
            </Link>
          ) : (
            <p className="text-sm font-semibold text-muted">
              Pausado: não aparece na loja.
            </p>
          )}
        </div>
        {novo === '1' && (
          <p className="-mt-4 rounded-xl bg-green-100 px-4 py-3 text-sm font-semibold text-green-900">
            Produto criado. Ele já aparece na loja. Se quiser, inclua adicionais
            logo abaixo.
          </p>
        )}

        <section aria-labelledby="dados" className={sectionClass}>
          <h2 id="dados" className={titleClass}>
            Dados do produto
          </h2>
          <ProductDataForm product={product} categories={categories} />
        </section>

        {product.variants.length > 0 && (
          <section aria-labelledby="opcoes" className={sectionClass}>
            <h2 id="opcoes" className={titleClass}>
              Opções e estoque
            </h2>
            <VariantsEditor product={product} />
          </section>
        )}

        <section aria-labelledby="adicionais" className={sectionClass}>
          <h2 id="adicionais" className={titleClass}>
            Adicionais
          </h2>
          <AddonsEditor product={product} />
        </section>

        <section aria-labelledby="apagar" className={sectionClass}>
          <h2 id="apagar" className={titleClass}>
            Apagar produto
          </h2>
          <DeleteProduct id={product.id} name={product.name} />
        </section>
      </main>
    </>
  );
}
