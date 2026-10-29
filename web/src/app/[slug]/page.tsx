import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CartBar } from '@/components/cart-links';
import { ChatIcon, SearchIcon, TruckIcon } from '@/components/icons';
import { FeaturedStrip, ProductList } from '@/components/product-list';
import { StoreSkeleton } from '@/components/skeletons';
import { StoreFooter, StoreHeader } from '@/components/store-header';
import { Photo } from '@/components/store-theme';
import { getCategories, getProducts, getStore } from '@/lib/api';
import type { Category, ProductSummary } from '@/lib/types';

export async function generateMetadata({
  params,
}: PageProps<'/[slug]'>): Promise<Metadata> {
  const store = await getStore((await params).slug);
  if (!store) return { title: 'Loja não encontrada' };
  return { title: store.name, description: store.description ?? undefined };
}

/**
 * Página da loja. O "esqueleto" aparece na hora; a loja entra assim que a
 * API responde (streaming, com Suspense).
 */
export default function StorePage(props: PageProps<'/[slug]'>) {
  return (
    <Suspense fallback={<StoreSkeleton />}>
      <StoreContent {...props} />
    </Suspense>
  );
}

async function StoreContent({ params, searchParams }: PageProps<'/[slug]'>) {
  const { slug } = await params;
  const { busca } = await searchParams;
  const search = typeof busca === 'string' ? busca.trim().slice(0, 60) : '';

  const [store, categories, products] = await Promise.all([
    getStore(slug),
    getCategories(slug),
    getProducts(slug, search || undefined),
  ]);
  if (!store) notFound();

  const featured = products.filter((product) => product.isFeatured);
  const sections = groupByCategory(categories, products);

  return (
    <>
      <StoreHeader store={store} />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4">
        <Photo
          src={store.theme.coverUrl}
          alt={`Capa da ${store.name}`}
          segment={store.segment}
          iconSize={44}
          sizes="(max-width: 768px) 100vw, 768px"
          className="h-40 rounded-store sm:h-56"
        />
        {store.description && <p className="text-muted">{store.description}</p>}
        <ul className="flex flex-wrap gap-2 text-xs font-semibold text-muted">
          <li className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5">
            <TruckIcon size={14} /> Entrega ou retirada
          </li>
          <li className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5">
            <ChatIcon size={14} /> Pedido pelo WhatsApp
          </li>
        </ul>

        <form className="flex items-center gap-2 rounded-store border border-line bg-surface px-3 text-muted">
          <SearchIcon size={18} />
          <label htmlFor="busca" className="sr-only">
            Buscar na loja
          </label>
          <input
            id="busca"
            name="busca"
            type="search"
            defaultValue={search}
            maxLength={60}
            placeholder="Buscar na loja"
            className="h-12 flex-1 bg-transparent text-ink outline-none placeholder:text-muted"
          />
        </form>

        {search ? (
          <section aria-labelledby="resultados" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2
                id="resultados"
                className="font-heading text-2xl font-semibold"
              >
                Resultados para “{search}”
              </h2>
              <Link
                href={`/${slug}`}
                className="shrink-0 text-sm font-semibold text-accent-ink"
              >
                Limpar busca
              </Link>
            </div>
            {products.length > 0 ? (
              <ProductList
                slug={slug}
                segment={store.segment}
                products={products}
              />
            ) : (
              <p className="text-muted">Nenhum produto encontrado.</p>
            )}
          </section>
        ) : (
          <>
            {sections.length > 1 && (
              <nav
                aria-label="Categorias"
                className="-mx-4 flex gap-2 overflow-x-auto px-4"
              >
                {sections.map(({ category }) => (
                  <a
                    key={category.id}
                    href={`#categoria-${category.id}`}
                    className="shrink-0 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink no-underline"
                  >
                    {category.name}
                  </a>
                ))}
              </nav>
            )}
            {featured.length > 0 && (
              <section
                aria-labelledby="destaques"
                className="flex flex-col gap-3"
              >
                <h2
                  id="destaques"
                  className="font-heading text-2xl font-semibold text-accent-ink"
                >
                  Destaques
                </h2>
                <FeaturedStrip
                  slug={slug}
                  segment={store.segment}
                  products={featured}
                />
              </section>
            )}
            {sections.map(({ category, items }) => (
              <section
                key={category.id}
                id={`categoria-${category.id}`}
                aria-labelledby={`titulo-${category.id}`}
                className="flex scroll-mt-4 flex-col gap-3"
              >
                <h2
                  id={`titulo-${category.id}`}
                  className="font-heading text-2xl font-semibold"
                >
                  {category.name}
                </h2>
                <ProductList
                  slug={slug}
                  segment={store.segment}
                  products={items}
                />
              </section>
            ))}
          </>
        )}
      </main>
      <StoreFooter />
      <CartBar slug={slug} />
    </>
  );
}

/** Junta os produtos por categoria, na ordem das categorias da loja. */
function groupByCategory(categories: Category[], products: ProductSummary[]) {
  const others: Category = { id: 'outros', name: 'Outros', productCount: 0 };
  return [...categories, others]
    .map((category) => ({
      category,
      items: products.filter(
        (product) => (product.category?.id ?? 'outros') === category.id,
      ),
    }))
    .filter((section) => section.items.length > 0);
}
