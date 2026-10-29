'use client';

import { useState, useTransition } from 'react';
import { saveVariants } from '@/app/painel/produtos/actions';
import type { ActionResult } from '@/lib/action-result';
import { formatBRL } from '@/lib/money';
import {
  parsePrice,
  parseStock,
  priceInput,
  type VariantChange,
} from '@/lib/product-form';
import type { PanelProduct } from '@/lib/types';
import { ResultText } from './feedback';
import { fieldClass } from './product-data-form';

interface Row {
  id: string;
  name: string;
  price: string;
  stock: string;
  isActive: boolean;
}

const toRows = (product: PanelProduct): Row[] =>
  product.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    price: priceInput(variant.priceCents),
    stock: variant.stock === null ? '' : String(variant.stock),
    isActive: variant.isActive,
  }));

/**
 * Opções do produto (tamanho, cor, peso...): preço, estoque e se está à
 * venda. Só manda para a API as linhas que mudaram.
 */
export function VariantsEditor({ product }: { product: PanelProduct }) {
  const [rows, setRows] = useState(() => toRows(product));
  const [result, setResult] = useState<ActionResult>(undefined);
  const [pending, startSave] = useTransition();
  const original = toRows(product);

  const change = (id: string, patch: Partial<Row>) =>
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );

  function save() {
    const changes: VariantChange[] = [];
    for (const row of rows) {
      const before = original.find((item) => item.id === row.id);
      if (
        before &&
        before.price === row.price &&
        before.stock === row.stock &&
        before.isActive === row.isActive
      ) {
        continue;
      }
      const priceCents = row.price.trim() ? parsePrice(row.price) : null;
      if (row.price.trim() && priceCents === null) {
        setResult({ error: `"${row.name}": preço inválido. Ex.: 19,90` });
        return;
      }
      const stock = parseStock(row.stock);
      if (stock === 'invalid') {
        setResult({ error: `"${row.name}": o estoque deve ser 0 ou mais.` });
        return;
      }
      changes.push({ id: row.id, priceCents, stock, isActive: row.isActive });
    }
    if (changes.length === 0) {
      setResult({ ok: 'Nada mudou.' });
      return;
    }
    startSave(async () => {
      setResult(await saveVariants(product.id, changes));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Preço vazio usa o preço do produto ({formatBRL(product.priceCents)}).
        Estoque vazio quer dizer que a loja não controla o estoque.
      </p>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3"
          >
            <span className="font-semibold">{row.name}</span>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                Preço (R$)
                <input
                  value={row.price}
                  inputMode="decimal"
                  placeholder={priceInput(product.priceCents)}
                  onChange={(event) =>
                    change(row.id, { price: event.target.value })
                  }
                  className={`${fieldClass} h-11 text-base`}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                Estoque
                <input
                  value={row.stock}
                  inputMode="numeric"
                  placeholder="Sem controle"
                  onChange={(event) =>
                    change(row.id, { stock: event.target.value })
                  }
                  className={`${fieldClass} h-11 text-base`}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={row.isActive}
                onChange={(event) =>
                  change(row.id, { isActive: event.target.checked })
                }
                className="size-5 accent-primary"
              />
              À venda
            </label>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="h-12 rounded-xl border-2 border-primary font-bold text-ink disabled:opacity-60"
      >
        {pending ? 'Salvando…' : 'Salvar opções'}
      </button>
      <ResultText result={result} />
    </div>
  );
}
