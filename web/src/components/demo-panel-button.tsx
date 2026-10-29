'use client';

import { type ReactNode, useState, useTransition } from 'react';
import { startSession } from '@/app/painel/actions';
import { loginAtApi } from '@/lib/panel-login';

/**
 * Loja de demonstração: entra direto no painel do lojista desta loja, com
 * um clique e sem mostrar as outras lojas. Com `orderId`, o painel já abre
 * nesse pedido.
 */
export function DemoPanelButton({
  slug,
  apiUrl,
  orderId,
  className,
  children,
}: {
  slug: string;
  apiUrl: string;
  orderId?: string;
  className: string;
  children: ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [saving, startSaving] = useTransition();

  async function enter() {
    setError(null);
    setWaiting(true);
    const outcome = await loginAtApi(apiUrl, '/auth/demo-login', { slug });
    setWaiting(false);
    if ('error' in outcome) {
      setError(outcome.error);
      return;
    }
    const next = orderId ? `/painel/pedidos/${orderId}` : undefined;
    startSaving(async () => {
      const result = await startSession(outcome.token, next);
      if (result) setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={waiting || saving}
        onClick={() => void enter()}
        className={`disabled:opacity-60 ${className}`}
      >
        {waiting || saving ? 'Entrando…' : children}
      </button>
      <span
        aria-live="assertive"
        className="text-sm font-semibold empty:hidden"
      >
        {error}
      </span>
    </>
  );
}
