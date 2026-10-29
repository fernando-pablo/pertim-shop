import { formatBRL } from './money';
import type { PanelProduct } from './types';

/**
 * Regras dos formulários de produto do painel. As mesmas funções rodam na
 * tela (aviso rápido) e na Server Action (ninguém pula a conferência). A
 * API confere tudo de novo.
 */

/** Maior preço aceito pela API: R$ 100.000,00 */
export const MAX_PRICE_CENTS = 10_000_000;
export const MAX_STOCK = 100_000;

/**
 * "19,90" -> 1990. Aceita "R$ 19,90", "19.90", "19" e "1.299,90".
 * Texto que não é preço devolve null.
 */
export function parsePrice(text: string): number | null {
  let value = text.replaceAll('R$', '').replaceAll(' ', '').trim();
  if (!value) return null;
  if (value.includes(',')) {
    value = value.replaceAll('.', '').replace(',', '.');
  } else if (!/^\d+\.\d{1,2}$/.test(value)) {
    value = value.replaceAll('.', '');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const cents = Math.round(Number(value) * 100);
  return cents <= MAX_PRICE_CENTS ? cents : null;
}

/** 1990 -> "19,90" (para preencher o campo de preço). */
export function priceInput(cents: number | null): string {
  if (cents === null) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
}

/** Estoque: vazio = não controla (null); senão, número inteiro. */
export function parseStock(text: string): number | null | 'invalid' {
  const value = text.trim();
  if (!value) return null;
  if (!/^\d+$/.test(value)) return 'invalid';
  const stock = Number(value);
  return stock <= MAX_STOCK ? stock : 'invalid';
}

export interface ProductInput {
  name: string;
  description: string;
  priceCents: number;
  categoryId: string | null;
  isFeatured: boolean;
  isActive: boolean;
}

/** Devolve o problema do formulário, ou null se está tudo certo. */
export function validateProduct(input: ProductInput): string | null {
  const name = input.name.trim();
  if (name.length < 2) return 'O nome precisa de 2 letras ou mais.';
  if (name.length > 80) return 'O nome pode ter até 80 letras.';
  if (input.description.trim().length > 500) {
    return 'A descrição pode ter até 500 letras.';
  }
  if (
    !Number.isInteger(input.priceCents) ||
    input.priceCents < 0 ||
    input.priceCents > MAX_PRICE_CENTS
  ) {
    return 'Informe um preço válido. Ex.: 19,90';
  }
  return null;
}

export interface AddonGroupInput {
  name: string;
  minSelect: number;
  maxSelect: number;
  addons: { name: string; priceCents: number }[];
}

/** Mesmas regras da API para os grupos de adicionais. */
export function validateAddonGroups(groups: AddonGroupInput[]): string | null {
  if (groups.length > 10) return 'Cada produto pode ter até 10 grupos.';
  for (const group of groups) {
    const name = group.name.trim() || 'Grupo sem nome';
    if (!group.name.trim() || group.name.trim().length > 60) {
      return 'Dê um nome para cada grupo (até 60 letras).';
    }
    if (group.addons.length === 0)
      return `"${name}": inclua pelo menos 1 item.`;
    if (group.addons.length > 30) return `"${name}": no máximo 30 itens.`;
    for (const addon of group.addons) {
      if (!addon.name.trim() || addon.name.trim().length > 60) {
        return `"${name}": dê um nome para cada item (até 60 letras).`;
      }
      if (
        !Number.isInteger(addon.priceCents) ||
        addon.priceCents < 0 ||
        addon.priceCents > MAX_PRICE_CENTS
      ) {
        return `"${name}": confira os preços dos itens.`;
      }
    }
    const { minSelect: min, maxSelect: max } = group;
    if (!Number.isInteger(min) || min < 0) {
      return `"${name}": o mínimo deve ser 0 ou mais.`;
    }
    if (!Number.isInteger(max) || max < 1) {
      return `"${name}": o máximo deve ser 1 ou mais.`;
    }
    if (min > max)
      return `"${name}": o mínimo não pode ser maior que o máximo.`;
    if (max > group.addons.length) {
      return `"${name}": o máximo não pode passar da quantidade de itens.`;
    }
  }
  return null;
}

export type StockTone = 'ok' | 'low' | 'out' | 'none';

/**
 * Resumo do estoque para a lista: soma as opções que estão à venda e
 * controlam estoque. Até 3 unidades é "últimas unidades".
 */
export function stockSummary(product: PanelProduct): {
  label: string;
  tone: StockTone;
} {
  const counted = product.variants.filter(
    (variant) => variant.isActive && variant.stock !== null,
  );
  if (counted.length === 0)
    return { label: 'Sem controle de estoque', tone: 'none' };
  const total = counted.reduce((sum, variant) => sum + (variant.stock ?? 0), 0);
  if (total === 0) return { label: 'Esgotado', tone: 'out' };
  const label = `${total} em estoque`;
  return { label, tone: total <= 3 ? 'low' : 'ok' };
}

/** Preço da lista: o do produto, ou a faixa quando as opções têm preço. */
export function priceSummary(product: PanelProduct): string {
  const prices = product.variants
    .filter((variant) => variant.isActive)
    .map((variant) => variant.priceCents ?? product.priceCents);
  if (prices.length === 0) return formatBRL(product.priceCents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatBRL(min) : `${formatBRL(min)} a ${formatBRL(max)}`;
}

/*
 * Conferência do que chega nas Server Actions. O navegador pode mandar
 * qualquer coisa, então tudo é lido campo a campo.
 */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readProductInput(raw: unknown): ProductInput | null {
  if (!isRecord(raw)) return null;
  const { name, description, priceCents, categoryId, isFeatured, isActive } =
    raw;
  if (typeof name !== 'string' || typeof description !== 'string') return null;
  if (typeof priceCents !== 'number') return null;
  if (typeof isFeatured !== 'boolean' || typeof isActive !== 'boolean') {
    return null;
  }
  if (
    categoryId !== null &&
    !(typeof categoryId === 'string' && UUID.test(categoryId))
  ) {
    return null;
  }
  return { name, description, priceCents, categoryId, isFeatured, isActive };
}

export interface VariantChange {
  id: string;
  priceCents: number | null;
  stock: number | null;
  isActive: boolean;
}

const isWhole = (value: unknown, max: number): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= max;

export function readVariantChanges(raw: unknown): VariantChange[] | null {
  if (!Array.isArray(raw) || raw.length > 100) return null;
  const changes: VariantChange[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.id !== 'string' || !UUID.test(item.id)) {
      return null;
    }
    const { priceCents, stock, isActive } = item;
    if (priceCents !== null && !isWhole(priceCents, MAX_PRICE_CENTS))
      return null;
    if (stock !== null && !isWhole(stock, MAX_STOCK)) return null;
    if (typeof isActive !== 'boolean') return null;
    changes.push({ id: item.id, priceCents, stock, isActive });
  }
  return changes;
}

export function readAddonGroups(raw: unknown): AddonGroupInput[] | null {
  if (!Array.isArray(raw)) return null;
  const groups: AddonGroupInput[] = [];
  for (const group of raw) {
    if (!isRecord(group) || typeof group.name !== 'string') return null;
    const { minSelect, maxSelect, addons } = group;
    if (typeof minSelect !== 'number' || typeof maxSelect !== 'number') {
      return null;
    }
    if (!Array.isArray(addons)) return null;
    const items: AddonGroupInput['addons'] = [];
    for (const addon of addons) {
      if (!isRecord(addon) || typeof addon.name !== 'string') return null;
      if (typeof addon.priceCents !== 'number') return null;
      items.push({ name: addon.name, priceCents: addon.priceCents });
    }
    groups.push({ name: group.name, minSelect, maxSelect, addons: items });
  }
  return groups;
}

/** Explica a regra do grupo para o lojista: "Obrigatório: escolher 1". */
export function describeRule(min: number, max: number): string {
  if (min === 0) return `Opcional: até ${max}`;
  if (min === max) return `Obrigatório: escolher ${min}`;
  return `Obrigatório: de ${min} a ${max}`;
}
