'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { toggleProduct } from '@/app/painel/produtos/actions';
import type { ActionResult } from '@/lib/action-result';
import { priceSummary, type StockTone, stockSummary } from '@/lib/product-form';
import { matchesSearch } from '@/lib/search-text';
import type { PanelCategory, PanelProduct } from '@/lib/types';
import { SearchIcon } from '../icons';
import { ResultText } from './feedback';

const TONES: Record<StockTone, string> = {
  ok: 'text-green-800',
  low: 'text-amber-800',
  out: 'text-red-800',
  none: 'text-muted',
};

/**
 * Lista de produtos do painel, com busca e atalhos para pausar e
 * destacar. Sem busca, agrupa na ordem das categorias da loja.
 */
export function ProductAdminList({
  products,
  categories,
}: {
  products: PanelProduct[];
  categories: PanelCategory[];
}) {
  const [search, setSearch] = useState('');
  // Cada palavra pode estar no nome ou na categoria, sem ligar para acento.
  const term = search.trim();
  const found = term
    ? products.filter((product) =>
        matchesSearch(`${product.name} ${product.category?.name ?? ''}`, term),
      )
    : products;

  const sections = term
    ? [
        {
          id: 'busca',
          title: `Resultados para “${term}”`,
          items: found,
        },
      ]
    : [
        ...categories.map((category) => ({
          id: category.id,
          title: category.name,
          items: products.filter((p) => p.category?.id === category.id),
        })),
        {
          id: 'sem-categoria',
          title: 'Sem categoria',
          items: products.filter((p) => !p.category),
        },
      ].filter((section) => section.items.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <label className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 text-muted">
        <SearchIcon size={18} />
        <span className="sr-only">Buscar produto</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar produto"
          className="h-12 flex-1 bg-transparent text-ink outline-none placeholder:text-muted"
        />
      </label>

      {sections.length === 0 && (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
          {term ? 'Nenhum produto com esse nome.' : 'Nenhum produto ainda.'}
        </p>
      )}

      {sections.map((section) => (
        <section key={section.id} className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">{section.title}</h2>
          <ul className="flex flex-col gap-2">
            {section.items.map((product) => (
              <li key={product.id}>
                <ProductRow product={product} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ProductRow({ product }: { product: PanelProduct }) {
  const [pending, startToggle] = useTransition();
  const [result, setResult] = useState<ActionResult>(undefined);
  const stock = stockSummary(product);

  function toggle(field: 'isActive' | 'isFeatured', value: boolean) {
    startToggle(async () => {
      const answer = await toggleProduct(product.id, field, value);
      setResult(answer && 'error' in answer ? answer : undefined);
    });
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 ${
        product.isActive ? '' : 'opacity-75'
      }`}
    >
      <Link
        href={`/painel/produtos/${product.id}`}
        className="flex items-center gap-3 text-ink no-underline"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-soft text-lg font-bold text-primary"
          >
            {product.name[0]}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-semibold">{product.name}</span>
          <span className="text-sm">{priceSummary(product)}</span>
          <span className={`text-xs font-semibold ${TONES[stock.tone]}`}>
            {stock.label}
          </span>
        </span>
        {!product.isActive && (
          <span className="shrink-0 rounded-full bg-stone-200 px-2.5 py-1 text-xs font-bold text-stone-700">
            Pausado
          </span>
        )}
      </Link>
      <div className="flex gap-2 text-sm font-semibold">
        <button
          type="button"
          disabled={pending}
          onClick={() => toggle('isActive', !product.isActive)}
          className="h-10 flex-1 rounded-xl border border-line px-3 text-ink disabled:opacity-60"
        >
          {product.isActive ? 'Pausar' : 'Voltar a vender'}
        </button>
        <button
          type="button"
          disabled={pending}
          aria-pressed={product.isFeatured}
          onClick={() => toggle('isFeatured', !product.isFeatured)}
          className={`h-10 flex-1 rounded-xl border px-3 disabled:opacity-60 ${
            product.isFeatured
              ? 'border-amber-300 bg-amber-100 text-amber-950'
              : 'border-line text-ink'
          }`}
        >
          {product.isFeatured ? '★ Em destaque' : '☆ Destacar'}
        </button>
      </div>
      <ResultText result={result} />
    </div>
  );
}
