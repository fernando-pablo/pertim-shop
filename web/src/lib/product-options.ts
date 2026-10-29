import type { AddonGroup, ProductDetail, Variant } from './types';

/**
 * Escolhas da página do produto (tamanho, cor, peso, adicionais).
 * Funções puras: a tela só mostra o que elas calculam.
 */

export type Selection = Record<string, string>;

const NAME_KEY = 'opção';

/**
 * Ordem em que os atributos aparecem na tela. O banco (JSON) não guarda a
 * ordem, então "tamanho" vem antes de "cor" por esta lista.
 */
const ATTRIBUTE_ORDER = ['tamanho', 'peso', 'cor', 'sabor', 'tipo', NAME_KEY];

const attributeRank = (key: string) => {
  const index = ATTRIBUTE_ORDER.indexOf(key);
  return index === -1 ? ATTRIBUTE_ORDER.length : index;
};

/**
 * Variações com os atributos garantidos. Se alguma não tiver atributos
 * (ex.: "Unidade"), usa o próprio nome como opção.
 */
export function normalizeVariants(variants: Variant[]): Variant[] {
  if (variants.length <= 1) return variants;
  const allHaveAttributes = variants.every(
    (variant) => Object.keys(variant.attributes ?? {}).length > 0,
  );
  if (allHaveAttributes) return variants;
  return variants.map((variant) => ({
    ...variant,
    attributes: { [NAME_KEY]: variant.name },
  }));
}

/** Atributos que o cliente precisa escolher (tamanho antes de cor). */
export function attributeKeys(variants: Variant[]): string[] {
  if (variants.length <= 1) return [];
  const keys: string[] = [];
  for (const variant of variants) {
    for (const key of Object.keys(variant.attributes)) {
      if (!keys.includes(key)) keys.push(key);
    }
  }
  return keys.sort((a, b) => attributeRank(a) - attributeRank(b));
}

export function optionValues(variants: Variant[], key: string): string[] {
  const values: string[] = [];
  for (const variant of variants) {
    const value = variant.attributes[key];
    if (value !== undefined && !values.includes(value)) values.push(value);
  }
  return values;
}

/** Já escolhe sozinho o que só tem uma opção (ex.: "Tamanho único"). */
export function initialSelection(variants: Variant[]): Selection {
  const selection: Selection = {};
  for (const key of attributeKeys(variants)) {
    const values = optionValues(variants, key);
    if (values.length === 1) selection[key] = values[0];
  }
  return selection;
}

export function findVariant(
  variants: Variant[],
  selection: Selection,
): Variant | undefined {
  if (variants.length === 1) return variants[0];
  const keys = attributeKeys(variants);
  if (keys.some((key) => selection[key] === undefined)) return undefined;
  return variants.find((variant) =>
    keys.every((key) => variant.attributes[key] === selection[key]),
  );
}

/**
 * Essa opção tem estoque, combinada com o que já foi escolhido nos outros
 * atributos? Ex.: tamanho G existe na cor Areia, mas acabou na cor Preto.
 */
export function isOptionAvailable(
  variants: Variant[],
  selection: Selection,
  key: string,
  value: string,
): boolean {
  return variants.some(
    (variant) =>
      variant.available &&
      variant.attributes[key] === value &&
      Object.entries(selection).every(
        ([otherKey, otherValue]) =>
          otherKey === key || variant.attributes[otherKey] === otherValue,
      ),
  );
}

export function attributeLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** Texto da regra do grupo: "Escolha 1", "Até 5 opções"... */
export function addonRuleText(group: AddonGroup): string {
  const { minSelect: min, maxSelect: max } = group;
  if (min === max) return `Escolha ${max}`;
  if (min === 0) return max === 1 ? 'Opcional' : `Até ${max} opções`;
  return `Escolha de ${min} a ${max}`;
}

/**
 * Marca ou desmarca um adicional. Grupo de escolha única funciona como
 * "bolinha" (troca a escolha); os outros respeitam o máximo.
 */
export function toggleAddon(
  group: AddonGroup,
  selected: string[],
  addonId: string,
): string[] {
  if (selected.includes(addonId)) {
    return selected.filter((id) => id !== addonId);
  }
  if (group.maxSelect === 1) return [addonId];
  if (selected.length >= group.maxSelect) return selected;
  return [...selected, addonId];
}

/** O que ainda falta escolher. Lista vazia = pode adicionar ao carrinho. */
export function missingChoices(
  product: ProductDetail,
  selection: Selection,
  addons: Record<string, string[]>,
): string[] {
  const variants = normalizeVariants(product.variants);
  const missing = attributeKeys(variants)
    .filter((key) => selection[key] === undefined)
    .map((key) => `Escolha: ${attributeLabel(key)}`);
  for (const group of product.addonGroups) {
    if ((addons[group.id]?.length ?? 0) < group.minSelect) {
      missing.push(`Escolha: ${group.name}`);
    }
  }
  return missing;
}

/** Preço de 1 unidade com a opção e os adicionais escolhidos. */
export function unitPrice(
  product: ProductDetail,
  variant: Variant | undefined,
  addonIds: string[],
): number {
  const base = variant?.priceCents ?? product.minPriceCents;
  const extras = product.addonGroups
    .flatMap((group) => group.addons)
    .filter((addon) => addonIds.includes(addon.id))
    .reduce((sum, addon) => sum + addon.priceCents, 0);
  return base + extras;
}
