import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CartView } from '@/components/cart-view';
import { StoreSkeleton } from '@/components/skeletons';
import { StoreFooter, StoreHeader } from '@/components/store-header';
import { getStore, publicApiUrl } from '@/lib/api';

export const metadata: Metadata = { title: 'Carrinho' };

export default function CartPage(props: PageProps<'/[slug]/carrinho'>) {
  return (
    <Suspense fallback={<StoreSkeleton />}>
      <CartContent {...props} />
    </Suspense>
  );
}

async function CartContent({ params }: PageProps<'/[slug]/carrinho'>) {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) notFound();

  return (
    <>
      <StoreHeader
        store={store}
        backHref={`/${slug}`}
        backLabel="Voltar para a loja"
        showCart={false}
      />
      <main className="mx-auto max-w-xl px-4">
        <CartView store={{ slug, name: store.name }} apiUrl={publicApiUrl()} />
      </main>
      <StoreFooter />
    </>
  );
}
