'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';

/**
 * Busca os pedidos de novo a cada X segundos, para pedido novo aparecer
 * sozinho. Com a aba escondida, espera: não gasta a API à toa.
 */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        startRefresh(() => router.refresh());
      }
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);

  return (
    <button
      type="button"
      onClick={() => startRefresh(() => router.refresh())}
      className="rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink"
    >
      {refreshing ? 'Atualizando…' : 'Atualizar'}
    </button>
  );
}
