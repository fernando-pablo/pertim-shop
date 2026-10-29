'use client';

import { type FormEvent, useState } from 'react';
import { type Cart, cartTotal } from '@/lib/cart';
import { formatBRL } from '@/lib/money';
import {
  apiErrorMessage,
  buildOrderPayload,
  type CheckoutForm as Form,
  maskPhone,
  validateCheckout,
} from '@/lib/order';
import type { Fulfillment, OrderCreated } from '@/lib/types';

const inputClass =
  'h-12 rounded-store border border-line bg-surface px-4 text-ink placeholder:text-muted';

const OPTIONS: { value: Fulfillment; label: string; hint: string }[] = [
  { value: 'PICKUP', label: 'Retirar na loja', hint: 'Você busca o pedido' },
  { value: 'DELIVERY', label: 'Entrega', hint: 'A loja leva até você' },
];

/**
 * Dados do cliente e envio do pedido. O navegador manda o pedido direto
 * para a API, que confere tudo, calcula o total e devolve a mensagem do
 * WhatsApp pronta.
 */
export function CheckoutForm({
  slug,
  isDemo,
  apiUrl,
  cart,
  onSent,
}: {
  slug: string;
  isDemo: boolean;
  apiUrl: string;
  cart: Cart;
  onSent: (result: OrderCreated) => void;
}) {
  const [form, setForm] = useState<Form>({
    customerName: '',
    customerPhone: '',
    fulfillment: 'PICKUP',
    address: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const change = (field: keyof Form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validateCheckout(form);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSending(true);
    try {
      const response = await fetch(`${apiUrl}/stores/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildOrderPayload(cart, form)),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(apiErrorMessage(response.status, body));
        return;
      }
      onSent(body as OrderCreated);
    } catch {
      setError('Sem conexão com a loja. Confira a internet e tente de novo.');
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-semibold">Finalizar pedido</h2>
      {isDemo && (
        <p className="rounded-store bg-soft px-4 py-3 text-sm">
          <strong>Loja de demonstração:</strong> use um nome e um telefone de
          teste. Outras pessoas que testam a demonstração podem ver este pedido.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="nome" className="font-bold">
          Seu nome
        </label>
        <input
          id="nome"
          autoComplete="name"
          maxLength={80}
          value={form.customerName}
          onChange={(event) => change('customerName', event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="telefone" className="font-bold">
          Telefone (WhatsApp)
        </label>
        <input
          id="telefone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="(00) 00000-0000"
          value={form.customerPhone}
          onChange={(event) =>
            change('customerPhone', maskPhone(event.target.value))
          }
          className={inputClass}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-bold">Como você quer receber?</legend>
        <div className="grid grid-cols-2 gap-2">
          {OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-store border-2 bg-surface p-3 ${
                form.fulfillment === option.value
                  ? 'border-primary'
                  : 'border-line'
              }`}
            >
              <span className="flex items-center gap-2 font-bold">
                <input
                  type="radio"
                  name="fulfillment"
                  value={option.value}
                  checked={form.fulfillment === option.value}
                  onChange={() => change('fulfillment', option.value)}
                  className="size-4 accent-[var(--store-primary)]"
                />
                {option.label}
              </span>
              <span className="text-sm text-muted">{option.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {form.fulfillment === 'DELIVERY' && (
        <div className="flex flex-col gap-2">
          <label htmlFor="endereco" className="font-bold">
            Endereço de entrega
          </label>
          <input
            id="endereco"
            autoComplete="street-address"
            maxLength={200}
            placeholder="Rua, número, bairro"
            value={form.address}
            onChange={(event) => change('address', event.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="obs-pedido" className="font-bold">
          Observações <span className="font-normal text-muted">(opcional)</span>
        </label>
        <input
          id="obs-pedido"
          maxLength={300}
          placeholder="Ex.: troco para R$ 100"
          value={form.notes}
          onChange={(event) => change('notes', event.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-store bg-surface p-3 font-semibold text-accent-ink"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="h-14 rounded-store bg-primary px-4 text-lg font-bold text-on-primary disabled:opacity-60"
      >
        {sending
          ? 'Enviando…'
          : `Enviar pedido · ${formatBRL(cartTotal(cart))}`}
      </button>
      <p className="text-center text-sm text-muted">
        O pedido segue pelo WhatsApp da loja, com tudo já escrito.
      </p>
    </form>
  );
}
