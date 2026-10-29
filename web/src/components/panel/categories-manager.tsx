'use client';

import { type FormEvent, useState, useTransition } from 'react';
import {
  addCategory,
  editCategory,
  removeCategory,
} from '@/app/painel/categorias/actions';
import type { ActionResult } from '@/lib/action-result';
import type { PanelCategory } from '@/lib/types';
import { ConfirmButton, ResultText } from './feedback';
import { fieldClass } from './product-data-form';

/** Criar, renomear e apagar categorias. */
export function CategoriesManager({
  categories,
}: {
  categories: PanelCategory[];
}) {
  const [name, setName] = useState('');
  const [result, setResult] = useState<ActionResult>(undefined);
  const [pending, startAdd] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startAdd(async () => {
      const answer = await addCategory(name);
      setResult(answer);
      if (answer && 'ok' in answer) setName('');
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={submit} className="flex flex-col gap-2" noValidate>
        <label htmlFor="nova-categoria" className="text-sm font-semibold">
          Nova categoria
        </label>
        <div className="flex gap-2">
          <input
            id="nova-categoria"
            value={name}
            maxLength={40}
            placeholder="Ex.: Promoções"
            onChange={(event) => setName(event.target.value)}
            className={`${fieldClass} min-w-0 flex-1`}
          />
          <button
            type="submit"
            disabled={pending}
            className="h-12 shrink-0 rounded-xl bg-primary px-4 font-bold text-on-primary disabled:opacity-60"
          >
            {pending ? 'Criando…' : 'Criar'}
          </button>
        </div>
        <ResultText result={result} />
      </form>

      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
          Nenhuma categoria ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {categories.map((category) => (
            <li key={category.id}>
              <CategoryRow category={category} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryRow({ category }: { category: PanelCategory }) {
  const [name, setName] = useState(category.name);
  const [result, setResult] = useState<ActionResult>(undefined);
  const [pending, startSave] = useTransition();
  const changed = name.trim() !== category.name;
  const count = category.productCount;
  const products = count === 1 ? '1 produto' : `${count} produtos`;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startSave(async () => setResult(await editCategory(category.id, name)));
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3">
      <form onSubmit={save} className="flex flex-col gap-2" noValidate>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Nome · {products}
          <input
            value={name}
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            className={`${fieldClass} h-11 text-base`}
          />
        </label>
        {changed && (
          <button
            type="submit"
            disabled={pending}
            className="h-10 w-fit rounded-xl bg-primary px-4 text-sm font-bold text-on-primary disabled:opacity-60"
          >
            {pending ? 'Salvando…' : 'Salvar nome'}
          </button>
        )}
        <ResultText result={result} />
      </form>
      <ConfirmButton
        label="Apagar categoria"
        question={
          count > 0
            ? `Apagar "${category.name}"? Os ${products} dela ficam sem categoria.`
            : `Apagar "${category.name}"?`
        }
        confirmLabel="Sim, apagar"
        onConfirm={() => removeCategory(category.id)}
      />
    </div>
  );
}
