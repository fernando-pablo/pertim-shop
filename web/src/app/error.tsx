'use client';

import { useEffect } from 'react';

/** Algo deu errado ao falar com a API (ex.: API desligada). */
export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-extrabold">Não foi possível carregar</h1>
      <p className="text-muted">
        A loja não respondeu agora. Tente de novo em alguns segundos.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-store bg-primary px-6 py-3 font-bold text-on-primary"
      >
        Tentar de novo
      </button>
    </main>
  );
}
