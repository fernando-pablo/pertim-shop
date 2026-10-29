'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { type ActionResult, callApi } from '@/lib/action-result';
import { isUuid } from '@/lib/panel-api';
import {
  createProduct,
  deleteProduct,
  replaceAddonGroups,
  setProductFlags,
  updateProduct,
  updateVariant,
} from '@/lib/panel-catalog-api';
import {
  readAddonGroups,
  readProductInput,
  readVariantChanges,
  validateAddonGroups,
  validateProduct,
} from '@/lib/product-form';

/**
 * Ações dos produtos no painel. Cada uma confere o que chegou do
 * navegador, chama a API com o token do cookie e atualiza a tela. Toda
 * mudança aqui apaga o cache da vitrine na API: a loja muda na hora.
 */

const INVALID = { error: 'Confira os dados e tente de novo.' };

/** Atalhos da lista: pausar/ativar e destacar. */
export async function toggleProduct(
  id: unknown,
  field: unknown,
  value: unknown,
): Promise<ActionResult> {
  if (typeof id !== 'string' || !isUuid(id) || typeof value !== 'boolean') {
    return INVALID;
  }
  if (field !== 'isActive' && field !== 'isFeatured') return INVALID;
  const result = await callApi(
    () => setProductFlags(id, { [field]: value }),
    'Salvo.',
  );
  refresh();
  return result;
}

/** Cria (id null) ou altera os dados do produto. */
export async function saveProduct(
  id: unknown,
  raw: unknown,
): Promise<ActionResult> {
  const input = readProductInput(raw);
  const productId =
    id === null ? null : typeof id === 'string' && isUuid(id) ? id : undefined;
  if (!input || productId === undefined) return INVALID;
  const problem = validateProduct(input);
  if (problem) return { error: problem };

  if (productId === null) {
    let createdId = '';
    const result = await callApi(async () => {
      createdId = (await createProduct(input)).id;
    }, 'Produto criado.');
    if (!createdId) return result;
    redirect(`/painel/produtos/${createdId}?novo=1`);
  }

  const result = await callApi(
    () => updateProduct(productId, input),
    'Alterações salvas.',
  );
  refresh();
  return result;
}

export async function removeProduct(id: unknown): Promise<ActionResult> {
  if (typeof id !== 'string' || !isUuid(id)) return INVALID;
  const result = await callApi(() => deleteProduct(id), 'Produto apagado.');
  if (result && 'error' in result) return result;
  redirect('/painel/produtos');
}

/** Preço, estoque e "à venda" de cada opção (tamanho, cor, peso...). */
export async function saveVariants(
  productId: unknown,
  raw: unknown,
): Promise<ActionResult> {
  const changes = readVariantChanges(raw);
  if (typeof productId !== 'string' || !isUuid(productId) || !changes) {
    return INVALID;
  }
  const result = await callApi(async () => {
    for (const { id, ...change } of changes) {
      await updateVariant(productId, id, change);
    }
  }, 'Opções salvas.');
  refresh();
  return result;
}

export async function saveAddonGroups(
  productId: unknown,
  raw: unknown,
): Promise<ActionResult> {
  const groups = readAddonGroups(raw);
  if (typeof productId !== 'string' || !isUuid(productId) || !groups) {
    return INVALID;
  }
  const problem = validateAddonGroups(groups);
  if (problem) return { error: problem };

  const result = await callApi(
    () => replaceAddonGroups(productId, groups),
    'Adicionais salvos.',
  );
  refresh();
  return result;
}
