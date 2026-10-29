import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProductForm } from '@/components/product-form';
import { ProductSkeleton } from '@/components/skeletons';
import { StoreFooter, StoreHeader } from '@/components/store-header';
import { Photo } from '@/components/store-theme';
import { getProduct, getStore } from '@/lib/api';

type Props = PageProps<'/[slug]/produto/[productId]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productId } = await params;
  const product = await getProduct(slug, productId);
  if (!product) return { title: 'Produto não encontrado' };
  return { title: product.name, description: product.description ?? undefined };
}

export default function ProductPage(props: Props) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent {...props} />
    </Suspense>
  );
}

async function ProductContent({ params }: Props) {
  const { slug, productId } = await params;
  const [store, product] = await Promise.all([
    getStore(slug),
    getProduct(slug, productId),
  ]);
  if (!store || !product) notFound();

  return (
    <>
      <StoreHeader
        store={store}
        backHref={`/${slug}`}
        backLabel="Voltar para a loja"
      />
      <main className="mx-auto grid max-w-3xl gap-6 px-4 sm:grid-cols-2">
        <Photo
          src={product.imageUrl}
          alt={product.name}
          segment={store.segment}
          iconSize={56}
          sizes="(max-width: 640px) 100vw, 384px"
          className="aspect-square rounded-store sm:sticky sm:top-4"
        />
        <div className="flex flex-col gap-4">
          {product.category && (
            <p className="text-xs font-bold tracking-widest text-accent-ink uppercase">
              {product.category.name}
            </p>
          )}
          <h1 className="font-heading text-3xl leading-tight font-semibold">
            {product.name}
          </h1>
          {product.description && (
            <p className="leading-relaxed text-muted">{product.description}</p>
          )}
          <ProductForm slug={slug} product={product} />
        </div>
      </main>
      <StoreFooter />
    </>
  );
}
