import { describe, expect, it } from 'vitest';
import {
  describeRule,
  parsePrice,
  parseStock,
  priceInput,
  priceSummary,
  readAddonGroups,
  readProductInput,
  readVariantChanges,
  stockSummary,
  validateAddonGroups,
  validateProduct,
} from './product-form';
import type { PanelProduct, PanelVariant } from './types';

describe('preço digitado no painel', () => {
  it('entende os jeitos comuns de escrever preço', () => {
    expect(parsePrice('19,90')).toBe(1990);
    expect(parsePrice('R$ 19,90')).toBe(1990);
    expect(parsePrice('19.90')).toBe(1990);
    expect(parsePrice('19')).toBe(1900);
    expect(parsePrice('1.299,90')).toBe(129990);
    expect(parsePrice('1.299')).toBe(129900);
    expect(parsePrice('0,5')).toBe(50);
  });

  it('recusa o que não é preço', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
    expect(parsePrice('-5')).toBeNull();
    expect(parsePrice('19,999')).toBeNull();
    expect(parsePrice('200000')).toBeNull(); // passa de R$ 100.000
  });

  it('preenche o campo a partir dos centavos', () => {
    expect(priceInput(1990)).toBe('19,90');
    expect(priceInput(500)).toBe('5,00');
    expect(priceInput(null)).toBe('');
  });
});

describe('estoque digitado no painel', () => {
  it('vazio é "não controla"; número inteiro é o estoque', () => {
    expect(parseStock('')).toBeNull();
    expect(parseStock(' 12 ')).toBe(12);
    expect(parseStock('0')).toBe(0);
  });

  it('recusa negativo, decimal e texto', () => {
    expect(parseStock('-1')).toBe('invalid');
    expect(parseStock('2,5')).toBe('invalid');
    expect(parseStock('muito')).toBe('invalid');
  });
});

describe('formulário do produto', () => {
  const ok = {
    name: 'Pastel de Queijo',
    description: '',
    priceCents: 900,
    categoryId: null,
    isFeatured: false,
    isActive: true,
  };

  it('aceita um produto certo', () => {
    expect(validateProduct(ok)).toBeNull();
  });

  it('pede nome e preço válidos', () => {
    expect(validateProduct({ ...ok, name: ' a ' })).toMatch(/nome/);
    expect(validateProduct({ ...ok, priceCents: -1 })).toMatch(/preço/);
    expect(validateProduct({ ...ok, description: 'x'.repeat(501) })).toMatch(
      /descrição/,
    );
  });
});

describe('grupos de adicionais', () => {
  const group = {
    name: 'Molhos',
    minSelect: 0,
    maxSelect: 2,
    addons: [
      { name: 'Cheddar', priceCents: 400 },
      { name: 'Barbecue', priceCents: 300 },
    ],
  };

  it('aceita um grupo certo', () => {
    expect(validateAddonGroups([group])).toBeNull();
  });

  it('segue as regras da API para mínimo e máximo', () => {
    expect(validateAddonGroups([{ ...group, minSelect: 3 }])).toMatch(
      /mínimo não pode ser maior/,
    );
    expect(validateAddonGroups([{ ...group, maxSelect: 3 }])).toMatch(
      /quantidade de itens/,
    );
    expect(validateAddonGroups([{ ...group, maxSelect: 0 }])).toMatch(
      /máximo deve ser 1/,
    );
  });

  it('pede nome no grupo e nos itens', () => {
    expect(validateAddonGroups([{ ...group, name: ' ' }])).toMatch(/nome/);
    expect(
      validateAddonGroups([
        { ...group, addons: [{ name: '', priceCents: 0 }], maxSelect: 1 },
      ]),
    ).toMatch(/nome para cada item/);
    expect(validateAddonGroups([{ ...group, addons: [] }])).toMatch(
      /pelo menos 1 item/,
    );
  });
});

describe('resumo do produto na lista', () => {
  const variant = (over: Partial<PanelVariant>): PanelVariant => ({
    id: 'v',
    name: 'M',
    attributes: {},
    priceCents: null,
    stock: null,
    isActive: true,
    position: 0,
    ...over,
  });
  const product = (variants: PanelVariant[]): PanelProduct => ({
    id: 'p',
    name: 'Ração',
    description: null,
    priceCents: 3490,
    imageUrl: null,
    isActive: true,
    isFeatured: false,
    position: 0,
    category: null,
    variants,
    addonGroups: [],
  });

  it('soma o estoque das opções à venda', () => {
    expect(
      stockSummary(
        product([
          variant({ stock: 5 }),
          variant({ stock: 4 }),
          variant({ stock: 9, isActive: false }),
        ]),
      ),
    ).toEqual({ label: '9 em estoque', tone: 'ok' });
  });

  it('avisa últimas unidades, esgotado e sem controle', () => {
    expect(stockSummary(product([variant({ stock: 2 })])).tone).toBe('low');
    expect(stockSummary(product([variant({ stock: 0 })])).label).toBe(
      'Esgotado',
    );
    expect(stockSummary(product([])).tone).toBe('none');
  });

  it('mostra a faixa de preço quando as opções têm preço próprio', () => {
    // O Intl usa espaço especial (U+00A0) depois do "R$".
    const plain = (text: string) => text.replaceAll('\u00a0', ' ');
    expect(plain(priceSummary(product([])))).toBe('R$ 34,90');
    expect(
      plain(
        priceSummary(product([variant({}), variant({ priceCents: 8990 })])),
      ),
    ).toBe('R$ 34,90 a R$ 89,90');
  });
});

describe('regra do grupo de adicionais', () => {
  it('explica em português', () => {
    expect(describeRule(0, 1)).toBe('Opcional: até 1');
    expect(describeRule(0, 5)).toBe('Opcional: até 5');
    expect(describeRule(1, 1)).toBe('Obrigatório: escolher 1');
    expect(describeRule(1, 3)).toBe('Obrigatório: de 1 a 3');
  });
});

describe('conferência do que chega nas Server Actions', () => {
  it('recusa dados com formato errado', () => {
    expect(readProductInput({ name: 'X' })).toBeNull();
    expect(
      readProductInput({
        name: 'Pastel',
        description: '',
        priceCents: 900,
        categoryId: 'nao-e-uuid',
        isFeatured: false,
        isActive: true,
      }),
    ).toBeNull();
    expect(readVariantChanges([{ id: 'x', priceCents: null }])).toBeNull();
    expect(
      readVariantChanges([
        {
          id: '0b9f4a1e-2c3d-4e5f-8a9b-0c1d2e3f4a5b',
          priceCents: -1,
          stock: null,
          isActive: true,
        },
      ]),
    ).toBeNull();
    expect(readAddonGroups([{ name: 'Molhos', addons: [] }])).toBeNull();
  });

  it('aceita dados certos', () => {
    expect(
      readVariantChanges([
        {
          id: '0b9f4a1e-2c3d-4e5f-8a9b-0c1d2e3f4a5b',
          priceCents: 1990,
          stock: 3,
          isActive: false,
        },
      ]),
    ).toHaveLength(1);
    expect(
      readAddonGroups([
        {
          name: 'Molhos',
          minSelect: 0,
          maxSelect: 1,
          addons: [{ name: 'Cheddar', priceCents: 400 }],
        },
      ]),
    ).toHaveLength(1);
  });
});
