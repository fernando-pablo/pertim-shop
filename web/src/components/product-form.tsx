'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { addItem, MAX_QUANTITY } from '@/lib/cart';
import { useCart } from '@/lib/cart-store';
import { formatBRL, formatPriceRange } from '@/lib/money';
import {
  addonRuleText,
  attributeKeys,
  attributeLabel,
  findVariant,
  initialSelection,
  isOptionAvailable,
  missingChoices,
  normalizeVariants,
  optionValues,
  toggleAddon,
  unitPrice,
} from '@/lib/product-options';
import type { ProductDetail } from '@/lib/types';
import { CheckIcon } from './icons';
import { QuantityStepper } from './quantity-stepper';

/** Escolhas do produto (opções, adicionais, quantidade) e o botão de adicionar. */
export function ProductForm({
  slug,
  product,
}: {
  slug: string;
  product: ProductDetail;
}) {
  const variants = useMemo(
    () => normalizeVariants(product.variants),
    [product.variants],
  );
  const keys = attributeKeys(variants);
  const [selection, setSelection] = useState(() => initialSelection(variants));
  const [addons, setAddons] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [, updateCart] = useCart(slug);

  const variant = findVariant(variants, selection);
  const addonIds = Object.values(addons).flat();
  const price = unitPrice(product, variant, addonIds);
  const soldOut = !product.available || (variant ? !variant.available : false);

  function choose(change: () => void) {
    change();
    setProblem(null);
    setAdded(false);
  }

  function add() {
    const missing = missingChoices(product, selection, addons);
    if (missing.length > 0) {
      setProblem(
        `Falta escolher: ${missing.map((m) => m.replace('Escolha: ', '')).join(', ')}`,
      );
      return;
    }
    const chosenAddons = product.addonGroups
      .flatMap((group) => group.addons)
      .filter((addon) => addonIds.includes(addon.id));
    updateCart((cart) =>
      addItem(cart, {
        productId: product.id,
        variantId: variant?.id ?? null,
        addonIds: chosenAddons.map((addon) => addon.id),
        notes,
        quantity,
        productName: product.name,
        variantName: keys.length > 0 ? (variant?.name ?? null) : null,
        addonNames: chosenAddons.map((addon) => addon.name),
        unitPriceCents: price,
      }),
    );
    setAdded(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-2xl font-bold text-primary">
        {variant
          ? formatBRL(variant.priceCents)
          : formatPriceRange(product.minPriceCents, product.maxPriceCents)}
      </p>

      {keys.map((key) => (
        <fieldset key={key} className="flex flex-col gap-2">
          <legend className="mb-2 font-bold">
            {attributeLabel(key)}
            {selection[key] && (
              <span className="font-normal text-muted">: {selection[key]}</span>
            )}
          </legend>
          <div className="flex flex-wrap gap-2">
            {optionValues(variants, key).map((value) => {
              const available = isOptionAvailable(
                variants,
                selection,
                key,
                value,
              );
              const selected = selection[key] === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  aria-label={available ? value : `${value} (esgotado)`}
                  onClick={() =>
                    choose(() => setSelection({ ...selection, [key]: value }))
                  }
                  className={`min-h-11 min-w-12 rounded-store border px-4 font-semibold ${
                    selected
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-line bg-surface text-ink'
                  } ${available ? '' : 'text-muted line-through opacity-60'}`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      {variant?.available && variant.lowStock && (
        <p className="text-sm font-semibold text-accent-ink">
          Últimas unidades
        </p>
      )}

      {product.addonGroups.map((group) => {
        const chosen = addons[group.id] ?? [];
        const single = group.minSelect >= 1 && group.maxSelect === 1;
        return (
          <fieldset
            key={group.id}
            className="flex flex-col rounded-store bg-surface"
          >
            <legend className="sr-only">{group.name}</legend>
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <p className="font-bold">{group.name}</p>
                <p className="text-sm text-muted">{addonRuleText(group)}</p>
              </div>
              {group.minSelect > 0 && (
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-on-accent">
                  Obrigatório
                </span>
              )}
            </div>
            {group.addons.map((addon) => {
              const checked = chosen.includes(addon.id);
              const full =
                !checked && !single && chosen.length >= group.maxSelect;
              return (
                <label
                  key={addon.id}
                  className={`flex min-h-12 items-center gap-3 border-b border-line px-4 last:border-b-0 ${full ? 'opacity-50' : ''}`}
                >
                  <input
                    type={single ? 'radio' : 'checkbox'}
                    name={group.id}
                    checked={checked}
                    disabled={full}
                    onChange={() =>
                      choose(() =>
                        setAddons({
                          ...addons,
                          [group.id]: toggleAddon(group, chosen, addon.id),
                        }),
                      )
                    }
                    className="size-5 accent-[var(--store-primary)]"
                  />
                  <span className="flex-1">{addon.name}</span>
                  {addon.priceCents > 0 && (
                    <span className="text-sm text-muted">
                      + {formatBRL(addon.priceCents)}
                    </span>
                  )}
                </label>
              );
            })}
          </fieldset>
        );
      })}

      <div className="flex flex-col gap-2">
        <label htmlFor="observacao" className="font-bold">
          Observação <span className="font-normal text-muted">(opcional)</span>
        </label>
        <input
          id="observacao"
          value={notes}
          maxLength={140}
          onChange={(event) => choose(() => setNotes(event.target.value))}
          placeholder={
            product.addonGroups.length > 0
              ? 'Ex.: sem cebola'
              : 'Alguma observação?'
          }
          className="h-12 rounded-store border border-line bg-surface px-4 text-ink placeholder:text-muted"
        />
      </div>

      {problem && (
        <p role="alert" className="font-semibold text-accent-ink">
          {problem}
        </p>
      )}

      {added ? (
        <div
          aria-live="polite"
          className="flex flex-col gap-3 rounded-store bg-surface p-4"
        >
          <p className="flex items-center gap-2 font-bold">
            <CheckIcon className="text-primary" /> Adicionado ao carrinho!
          </p>
          <div className="flex gap-2">
            <Link
              href={`/${slug}`}
              className="flex h-12 flex-1 items-center justify-center rounded-store border border-line font-semibold text-ink no-underline"
            >
              Continuar comprando
            </Link>
            <Link
              href={`/${slug}/carrinho`}
              className="flex h-12 flex-1 items-center justify-center rounded-store bg-primary font-semibold text-on-primary no-underline"
            >
              Ver carrinho
            </Link>
          </div>
        </div>
      ) : (
        <div className="sticky bottom-0 -mx-4 flex gap-3 bg-bg px-4 py-3">
          <QuantityStepper
            value={quantity}
            max={MAX_QUANTITY}
            onChange={setQuantity}
          />
          <button
            type="button"
            onClick={add}
            disabled={soldOut}
            className="h-14 flex-1 rounded-store bg-primary px-4 font-bold text-on-primary disabled:opacity-50"
          >
            {soldOut
              ? 'Esgotado'
              : `Adicionar · ${formatBRL(price * quantity)}`}
          </button>
        </div>
      )}
    </div>
  );
}
