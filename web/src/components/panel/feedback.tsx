'use client';

import { useState, useTransition } from 'react';
import type { ActionResult } from '@/lib/action-result';

/** Mensagem de "salvo" (verde) ou de erro (vermelha) depois de uma ação. */
export function ResultText({ result }: { result: ActionResult }) {
  const error = result && 'error' in result ? result.error : null;
  const ok = result && 'ok' in result ? result.ok : null;
  return (
    <p
      aria-live="polite"
      className={`rounded-xl px-4 py-3 text-sm font-semibold empty:hidden ${
        error ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'
      }`}
    >
      {error ?? ok}
    </p>
  );
}

/**
 * Botão de ação perigosa (apagar, restaurar): pede confirmação antes,
 * sem a janela do navegador.
 */
export function ConfirmButton({
  label,
  question,
  confirmLabel,
  onConfirm,
}: {
  label: string;
  question: string;
  confirmLabel: string;
  onConfirm: () => Promise<ActionResult>;
}) {
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<ActionResult>(undefined);
  const [pending, startAction] = useTransition();

  function confirm() {
    startAction(async () => {
      setResult(await onConfirm());
      setAsking(false);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {asking ? (
        <div className="flex flex-col gap-2 rounded-xl bg-red-50 p-3">
          <p className="text-sm text-red-900">{question}</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={confirm}
              className="h-11 flex-1 rounded-xl bg-red-700 px-3 font-bold text-white disabled:opacity-60"
            >
              {pending ? 'Aguarde…' : confirmLabel}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setAsking(false)}
              className="h-11 flex-1 rounded-xl border border-line bg-surface px-3 font-semibold text-ink"
            >
              Voltar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setResult(undefined);
            setAsking(true);
          }}
          className="h-11 w-fit rounded-xl px-1 font-semibold text-red-800 underline"
        >
          {label}
        </button>
      )}
      <ResultText result={result} />
    </div>
  );
}
