'use client';

import { useState, useTransition } from 'react';
import { changeOrderStatus } from '@/app/painel/actions';
import { ACTION_LABELS, nextSteps } from '@/lib/order-status';
import type { Fulfillment, OrderStatus } from '@/lib/types';

/**
 * Botões para mudar a situação do pedido. O principal é o próximo passo
 * mais comum; cancelar pede confirmação, porque devolve o estoque e não
 * tem volta.
 */
export function OrderActions({
  orderId,
  status,
  fulfillment,
}: {
  orderId: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
}) {
  const { main, others, canCancel } = nextSteps(status, fulfillment);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [pending, startChange] = useTransition();

  if (!main && !canCancel) return null;

  function change(next: OrderStatus) {
    setError(null);
    setTarget(next);
    startChange(async () => {
      const result = await changeOrderStatus(orderId, next);
      if (result) setError(result.error);
      setConfirmCancel(false);
    });
  }

  const label = (next: OrderStatus) =>
    pending && target === next ? 'Salvando…' : ACTION_LABELS[next];

  return (
    <div className="flex flex-col gap-2">
      {main && (
        <button
          type="button"
          disabled={pending}
          onClick={() => change(main)}
          className="h-12 rounded-xl bg-primary font-bold text-on-primary disabled:opacity-60"
        >
          {label(main)}
        </button>
      )}
      {others.map((next) => (
        <button
          key={next}
          type="button"
          disabled={pending}
          onClick={() => change(next)}
          className="h-11 rounded-xl border border-line bg-surface font-semibold text-ink disabled:opacity-60"
        >
          {label(next)}
        </button>
      ))}
      {canCancel &&
        (confirmCancel ? (
          <div className="flex flex-col gap-2 rounded-xl bg-red-50 p-3">
            <p className="text-sm text-red-900">
              Cancelar o pedido? Os produtos voltam para o estoque.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => change('CANCELED')}
                className="h-11 flex-1 rounded-xl bg-red-700 font-bold text-white disabled:opacity-60"
              >
                {pending && target === 'CANCELED'
                  ? 'Cancelando…'
                  : 'Sim, cancelar'}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmCancel(false)}
                className="h-11 flex-1 rounded-xl border border-line bg-surface font-semibold text-ink"
              >
                Voltar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmCancel(true)}
            className="h-11 rounded-xl font-semibold text-red-800 underline disabled:opacity-60"
          >
            {ACTION_LABELS.CANCELED}
          </button>
        ))}
      <p
        aria-live="assertive"
        className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-900 empty:hidden"
      >
        {error}
      </p>
    </div>
  );
}
