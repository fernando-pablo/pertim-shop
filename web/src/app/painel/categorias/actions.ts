'use server';

import { refresh } from 'next/cache';
import { type ActionResult, callApi } from '@/lib/action-result';
import { isUuid } from '@/lib/panel-api';
import {
  createCategory,
  deleteCategory,
  renameCategory,
} from '@/lib/panel-catalog-api';

/** Ações das categorias no painel. A API apaga o cache da vitrine. */

function readName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.trim();
  return name.length >= 2 && name.length <= 40 ? name : null;
}

const NAME_ERROR = { error: 'O nome precisa ter de 2 a 40 letras.' };

export async function addCategory(name: unknown): Promise<ActionResult> {
  const value = readName(name);
  if (!value) return NAME_ERROR;
  const result = await callApi(
    () => createCategory(value),
    'Categoria criada.',
  );
  refresh();
  return result;
}

export async function editCategory(
  id: unknown,
  name: unknown,
): Promise<ActionResult> {
  const value = readName(name);
  if (!value) return NAME_ERROR;
  if (typeof id !== 'string' || !isUuid(id)) {
    return { error: 'Categoria não encontrada.' };
  }
  const result = await callApi(() => renameCategory(id, value), 'Nome salvo.');
  refresh();
  return result;
}

/** Os produtos da categoria apagada ficam sem categoria. */
export async function removeCategory(id: unknown): Promise<ActionResult> {
  if (typeof id !== 'string' || !isUuid(id)) {
    return { error: 'Categoria não encontrada.' };
  }
  const result = await callApi(() => deleteCategory(id), 'Categoria apagada.');
  refresh();
  return result;
}
