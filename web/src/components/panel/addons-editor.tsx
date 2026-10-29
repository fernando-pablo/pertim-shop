'use client';

import { useState, useTransition } from 'react';
import { saveAddonGroups } from '@/app/painel/produtos/actions';
import type { ActionResult } from '@/lib/action-result';
import {
  type AddonGroupInput,
  describeRule,
  parsePrice,
  priceInput,
  validateAddonGroups,
} from '@/lib/product-form';
import type { PanelProduct } from '@/lib/types';
import { TrashIcon } from '../icons';
import { ResultText } from './feedback';
import { fieldClass } from './product-data-form';

export interface GroupDraft {
  key: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  addons: { key: string; name: string; price: string }[];
}

let counter = 0;
const newKey = () => `novo-${++counter}`;

const toDrafts = (product: PanelProduct): GroupDraft[] =>
  product.addonGroups.map((group) => ({
    key: group.id,
    name: group.name,
    minSelect: group.minSelect,
    maxSelect: group.maxSelect,
    addons: group.addons.map((addon) => ({
      key: addon.id,
      name: addon.name,
      price: priceInput(addon.priceCents),
    })),
  }));

/**
 * Grupos de adicionais (ex.: "Ponto da carne", "Molhos"), cada um com
 * mínimo, máximo e itens com preço. Salva todos de uma vez, como a API.
 */
export function AddonsEditor({ product }: { product: PanelProduct }) {
  const [groups, setGroups] = useState(() => toDrafts(product));
  const [result, setResult] = useState<ActionResult>(undefined);
  const [pending, startSave] = useTransition();

  const update = (key: string, patch: Partial<GroupDraft>) =>
    setGroups((current) =>
      current.map((group) =>
        group.key === key ? { ...group, ...patch } : group,
      ),
    );

  function addGroup() {
    setGroups((current) => [
      ...current,
      {
        key: newKey(),
        name: '',
        minSelect: 0,
        maxSelect: 1,
        addons: [{ key: newKey(), name: '', price: '' }],
      },
    ]);
  }

  function save() {
    const input: AddonGroupInput[] = [];
    for (const group of groups) {
      const addons = [];
      for (const addon of group.addons) {
        const priceCents = addon.price.trim() ? parsePrice(addon.price) : 0;
        if (priceCents === null) {
          const where = group.name || 'Grupo sem nome';
          setResult({ error: `"${where}": confira os preços dos itens.` });
          return;
        }
        addons.push({ name: addon.name, priceCents });
      }
      input.push({ ...group, addons });
    }
    const problem = validateAddonGroups(input);
    if (problem) {
      setResult({ error: problem });
      return;
    }
    startSave(async () => {
      setResult(await saveAddonGroups(product.id, input));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.length === 0 && (
        <p className="text-sm text-muted">
          Este produto não tem adicionais. Ex.: molhos, bordas, ponto da carne.
        </p>
      )}
      {groups.map((group) => (
        <GroupEditor
          key={group.key}
          group={group}
          onChange={(patch) => update(group.key, patch)}
          onRemove={() =>
            setGroups((current) =>
              current.filter((item) => item.key !== group.key),
            )
          }
        />
      ))}
      <button
        type="button"
        onClick={addGroup}
        className="h-11 rounded-xl border border-dashed border-line font-semibold text-ink"
      >
        + Adicionar grupo
      </button>
      <p className="text-xs text-muted">
        Pedidos já feitos não mudam: eles guardam os adicionais do jeito que
        estavam.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="h-12 rounded-xl border-2 border-primary font-bold text-ink disabled:opacity-60"
      >
        {pending ? 'Salvando…' : 'Salvar adicionais'}
      </button>
      <ResultText result={result} />
    </div>
  );
}

function GroupEditor({
  group,
  onChange,
  onRemove,
}: {
  group: GroupDraft;
  onChange: (patch: Partial<GroupDraft>) => void;
  onRemove: () => void;
}) {
  const setAddon = (key: string, patch: { name?: string; price?: string }) =>
    onChange({
      addons: group.addons.map((addon) =>
        addon.key === key ? { ...addon, ...patch } : addon,
      ),
    });
  const number = (text: string) => Math.max(0, Number.parseInt(text, 10) || 0);

  return (
    <fieldset className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface p-3">
      <legend className="sr-only">Grupo {group.name}</legend>
      <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
        Nome do grupo
        <input
          value={group.name}
          maxLength={60}
          placeholder="Ex.: Molhos"
          onChange={(event) => onChange({ name: event.target.value })}
          className={`${fieldClass} h-11 text-base`}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Mínimo de escolhas
          <input
            type="number"
            min={0}
            value={group.minSelect}
            onChange={(event) =>
              onChange({ minSelect: number(event.target.value) })
            }
            className={`${fieldClass} h-11 text-base`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Máximo de escolhas
          <input
            type="number"
            min={1}
            value={group.maxSelect}
            onChange={(event) =>
              onChange({ maxSelect: number(event.target.value) })
            }
            className={`${fieldClass} h-11 text-base`}
          />
        </label>
      </div>
      <p className="text-sm font-semibold text-accent-ink">
        {describeRule(group.minSelect, group.maxSelect)}
      </p>
      <ul className="flex flex-col gap-2">
        {group.addons.map((addon, index) => (
          <li key={addon.key} className="flex items-end gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-muted">
              Item {index + 1}
              <input
                value={addon.name}
                maxLength={60}
                placeholder="Ex.: Cheddar"
                onChange={(event) =>
                  setAddon(addon.key, { name: event.target.value })
                }
                className={`${fieldClass} h-11 text-base`}
              />
            </label>
            <label className="flex w-24 flex-col gap-1 text-xs font-semibold text-muted">
              Preço
              <input
                value={addon.price}
                inputMode="decimal"
                placeholder="0,00"
                onChange={(event) =>
                  setAddon(addon.key, { price: event.target.value })
                }
                className={`${fieldClass} h-11 px-3 text-base`}
              />
            </label>
            <button
              type="button"
              aria-label={`Tirar o item ${addon.name || index + 1}`}
              onClick={() =>
                onChange({
                  addons: group.addons.filter((item) => item.key !== addon.key),
                })
              }
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line text-muted"
            >
              <TrashIcon size={18} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() =>
            onChange({
              addons: [...group.addons, { key: newKey(), name: '', price: '' }],
            })
          }
          className="h-10 rounded-xl px-1 text-ink underline"
        >
          + Adicionar item
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="h-10 rounded-xl px-1 text-red-800 underline"
        >
          Remover grupo
        </button>
      </div>
    </fieldset>
  );
}
