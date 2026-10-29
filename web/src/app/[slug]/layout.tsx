import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { StoreSkeleton } from '@/components/skeletons';
import { StoreTheme } from '@/components/store-theme';
import { getStore } from '@/lib/api';

/**
 * Tudo dentro de /[loja] ganha o visual da loja. Como o layout continua na
 * tela ao trocar de página, o cliente não vê a cor "piscar" ao navegar.
 */
export default function StoreLayout({
  children,
  params,
}: LayoutProps<'/[slug]'>) {
  return (
    <Suspense fallback={<StoreSkeleton />}>
      <ThemedStore params={params}>{children}</ThemedStore>
    </Suspense>
  );
}

async function ThemedStore({
  params,
  children,
}: Pick<LayoutProps<'/[slug]'>, 'params' | 'children'>) {
  const store = await getStore((await params).slug);
  if (!store) notFound();
  return <StoreTheme store={store}>{children}</StoreTheme>;
}
