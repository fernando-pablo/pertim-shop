import { describe, expect, it } from 'vitest';
import {
  addonRuleText,
  attributeKeys,
  findVariant,
  initialSelection,
  isOptionAvailable,
  missingChoices,
  normalizeVariants,
  optionValues,
  toggleAddon,
  unitPrice,
} from './product-options';
import type { AddonGroup, ProductDetail, Variant } from './types';

const variant = (
  id: string,
  attributes: Record<string, string>,
  available = true,
): Variant => ({
  id,
  name: Object.values(attributes).join(' / '),
  attributes,
  priceCents: 18990,
  available,
  lowStock: false,
});

// Vestido Midi: G / Preto esgotado.
const dress = [
  variant('pa', { tamanho: 'P', cor: 'Areia' }),
  variant('pp', { tamanho: 'P', cor: 'Preto' }),
  variant('ga', { tamanho: 'G', cor: 'Areia' }),
  variant('gp', { tamanho: 'G', cor: 'Preto' }, false),
];

const extras: AddonGroup = {
  id: 'g1',
  name: 'Adicionais',
  minSelect: 0,
  maxSelect: 2,
  addons: [
    { id: 'bacon', name: 'Bacon', priceCents: 400 },
    { id: 'ovo', name: 'Ovo', priceCents: 250 },
    { id: 'queijo', name: 'Queijo extra', priceCents: 300 },
  ],
};

const point: AddonGroup = {
  id: 'g2',
  name: 'Ponto da carne',
  minSelect: 1,
  maxSelect: 1,
  addons: [
    { id: 'mal', name: 'Mal passada', priceCents: 0 },
    { id: 'bem', name: 'Bem passada', priceCents: 0 },
  ],
};

const burger: ProductDetail = {
  id: 'b1',
  name: 'Burger Trem Bão',
  description: null,
  imageUrl: null,
  category: null,
  isFeatured: true,
  minPriceCents: 3290,
  maxPriceCents: 3290,
  hasVariants: false,
  available: true,
  variants: [],
  addonGroups: [point, extras],
};

describe('opções do produto', () => {
  it('lista os atributos (tamanho antes de cor) e os valores', () => {
    expect(attributeKeys(dress)).toEqual(['tamanho', 'cor']);
    const fromDatabase = dress.map((v) => ({
      ...v,
      attributes: { cor: v.attributes.cor, tamanho: v.attributes.tamanho },
    }));
    expect(attributeKeys(fromDatabase)).toEqual(['tamanho', 'cor']);
    expect(optionValues(dress, 'cor')).toEqual(['Areia', 'Preto']);
  });

  it('acha a variação só quando tudo foi escolhido', () => {
    expect(findVariant(dress, { tamanho: 'G' })).toBeUndefined();
    expect(findVariant(dress, { tamanho: 'G', cor: 'Areia' })?.id).toBe('ga');
  });

  it('marca como esgotada a combinação sem estoque', () => {
    expect(isOptionAvailable(dress, { tamanho: 'G' }, 'cor', 'Preto')).toBe(
      false,
    );
    expect(isOptionAvailable(dress, { tamanho: 'P' }, 'cor', 'Preto')).toBe(
      true,
    );
  });

  it('variação única ou atributo com um valor só já vem escolhido', () => {
    const single = [variant('u', { tamanho: 'Único' })];
    expect(findVariant(single, {})?.id).toBe('u');
    expect(
      initialSelection([
        variant('a', { tamanho: 'P', cor: 'Preto' }),
        variant('b', { tamanho: 'M', cor: 'Preto' }),
      ]),
    ).toEqual({ cor: 'Preto' });
  });

  it('variações sem atributos usam o nome como opção', () => {
    const plain = normalizeVariants([
      { ...variant('a', {}), name: 'Unidade' },
      { ...variant('b', {}), name: 'Caixa' },
    ]);
    expect(optionValues(plain, attributeKeys(plain)[0])).toEqual([
      'Unidade',
      'Caixa',
    ]);
  });

  it('escolha única troca a opção; os outros grupos respeitam o máximo', () => {
    expect(toggleAddon(point, ['mal'], 'bem')).toEqual(['bem']);
    expect(toggleAddon(extras, ['bacon', 'ovo'], 'queijo')).toEqual([
      'bacon',
      'ovo',
    ]);
    expect(toggleAddon(extras, ['bacon', 'ovo'], 'ovo')).toEqual(['bacon']);
  });

  it('explica a regra de cada grupo', () => {
    expect(addonRuleText(point)).toBe('Escolha 1');
    expect(addonRuleText(extras)).toBe('Até 2 opções');
  });

  it('avisa o que falta escolher', () => {
    expect(missingChoices(burger, {}, {})).toEqual(['Escolha: Ponto da carne']);
    expect(missingChoices(burger, {}, { g2: ['mal'] })).toEqual([]);
  });

  it('soma o preço dos adicionais', () => {
    expect(unitPrice(burger, undefined, ['bacon', 'mal'])).toBe(3290 + 400);
  });
});
