'use client';

import { type FormEvent, useState, useTransition } from 'react';
import { saveProduct } from '@/app/painel/produtos/actions';
import type { ActionResult } from '@/lib/action-result';
import {
  parsePrice,
  priceInput,
  type ProductInput,
  validateProduct,
} from '@/lib/product-form';
import type { PanelCategory, PanelProduct } from '@/lib/types';
import { ResultText } from './feedback';

export const fieldClass =
  'h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-4 text-ink placeholder:text-muted';
export const labelClass = 'flex flex-col gap-1.5 text-sm font-semibold';

/**
 * Dados do produto: nome, descrição, preço, categoria, destaque e se está
 * à venda. Sem `product`, cria um produto novo.
 */
export function ProductDataForm({
  product,
  categories,
}: {
  product?: PanelProduct;
  categories: PanelCategory[];
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(priceInput(product?.priceCents ?? null));
  const [categoryId, setCategoryId] = useState(product?.category?.id ?? '');
  const [isFeatured, setFeatured] = useState(product?.isFeatured ?? false);
  const [isActive, setActive] = useState(product?.isActive ?? true);
  const [result, setResult] = useState<ActionResult>(undefined);
  const [pending, startSave] = useTransition();
  const ownPrices = product?.variants.some((v) => v.priceCents !== null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const priceCents = parsePrice(price);
    if (priceCents === null) {
      setResult({ error: 'Informe um preço válido. Ex.: 19,90' });
      return;
    }
    const input: ProductInput = {
      name,
      description,
      priceCents,
      categoryId: categoryId || null,
      isFeatured,
      isActive,
    };
    const problem = validateProduct(input);
    if (problem) {
      setResult({ error: problem });
      return;
    }
    startSave(async () => {
      setResult(await saveProduct(product?.id ?? null, input));
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <label className={labelClass}>
        Nome
        <input
          value={name}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className={labelClass}>
        Descrição (opcional)
        <textarea
          value={description}
          maxLength={500}
          rows={3}
          onChange={(event) => setDescription(event.target.value)}
          className="rounded-xl border border-line bg-surface px-4 py-3 text-ink"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Preço (R$)
          <input
            value={price}
            inputMode="decimal"
            placeholder="19,90"
            onChange={(event) => setPrice(event.target.value)}
            className={fieldClass}
          />
          {ownPrices && (
            <span className="font-normal text-muted">
              Opções com preço próprio usam o preço delas.
            </span>
          )}
        </label>
        <label className={labelClass}>
          Categoria
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={fieldClass}
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex items-center gap-3 font-semibold">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setActive(event.target.checked)}
          className="size-5 accent-primary"
        />
        À venda na loja
      </label>
      <label className="flex items-center gap-3 font-semibold">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(event) => setFeatured(event.target.checked)}
          className="size-5 accent-primary"
        />
        Mostrar nos destaques
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl bg-primary font-bold text-on-primary disabled:opacity-60"
      >
        {pending
          ? 'Salvando…'
          : product
            ? 'Salvar alterações'
            : 'Criar produto'}
      </button>
      <ResultText result={result} />
    </form>
  );
}
