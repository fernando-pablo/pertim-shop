import { BadRequestException } from '@nestjs/common';
import { PricingProduct, priceOrder } from './order-pricing';

/** Produtos "de mentira" no formato que vem do banco. */
function product(
  id: string,
  priceCents: number,
  extra: Partial<PricingProduct> = {},
): PricingProduct {
  return {
    id,
    storeId: 'loja-1',
    categoryId: null,
    name: id,
    description: null,
    priceCents,
    imageUrl: null,
    isActive: true,
    isFeatured: false,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    variants: [],
    addonGroups: [],
    ...extra,
  };
}

function variant(id: string, priceCents: number | null, stock: number | null) {
  return {
    id,
    productId: 'x',
    name: id,
    attributes: {},
    priceCents,
    stock,
    isActive: true,
    position: 0,
  };
}

function group(
  id: string,
  minSelect: number,
  maxSelect: number,
  addons: [string, number][],
) {
  return {
    id,
    productId: 'x',
    name: id,
    minSelect,
    maxSelect,
    position: 0,
    addons: addons.map(([addonId, priceCents]) => ({
      id: addonId,
      groupId: id,
      name: addonId,
      priceCents,
      isActive: true,
      position: 0,
    })),
  };
}

const burger = product('burger', 3290, {
  addonGroups: [
    group('Ponto', 1, 1, [
      ['ao-ponto', 0],
      ['bem-passada', 0],
    ]),
    group('Adicionais', 0, 2, [
      ['bacon', 400],
      ['ovo', 250],
      ['queijo', 300],
    ]),
  ],
});
const racao = product('racao', 3490, {
  variants: [variant('1kg', 3490, 10), variant('15kg', 32990, 3)],
});
const brinco = product('brinco', 4990, {
  variants: [variant('unico', null, 5)],
});

describe('priceOrder', () => {
  it('soma produto, adicionais e quantidade', () => {
    const result = priceOrder(
      [burger],
      [{ productId: 'burger', quantity: 2, addonIds: ['ao-ponto', 'bacon'] }],
    );

    expect(result.lines[0].unitPriceCents).toBe(3690);
    expect(result.lines[0].totalCents).toBe(7380);
    expect(result.subtotalCents).toBe(7380);
    expect(result.lines[0].addons.map((a) => a.name)).toEqual([
      'ao-ponto',
      'bacon',
    ]);
  });

  it('usa o preço da variação escolhida e soma o estoque necessário', () => {
    const result = priceOrder(
      [racao],
      [
        { productId: 'racao', variantId: '15kg', quantity: 1 },
        { productId: 'racao', variantId: '15kg', quantity: 2 },
      ],
    );

    expect(result.subtotalCents).toBe(3 * 32990);
    expect(result.stockNeeds).toEqual([
      { variantId: '15kg', quantity: 3, label: 'racao (15kg)' },
    ]);
  });

  it('escolhe sozinho quando só existe uma variação', () => {
    const result = priceOrder([brinco], [{ productId: 'brinco', quantity: 1 }]);

    expect(result.lines[0].variantId).toBe('unico');
    expect(result.lines[0].unitPriceCents).toBe(4990);
  });

  it.each([
    ['produto que não está na loja', [{ productId: 'outro', quantity: 1 }]],
    ['falta escolher a variação', [{ productId: 'racao', quantity: 1 }]],
    [
      'variação de outro produto',
      [{ productId: 'racao', variantId: 'unico', quantity: 1 }],
    ],
    ['falta o adicional obrigatório', [{ productId: 'burger', quantity: 1 }]],
    [
      'passou do máximo de adicionais',
      [
        {
          productId: 'burger',
          quantity: 1,
          addonIds: ['ao-ponto', 'bacon', 'ovo', 'queijo'],
        },
      ],
    ],
    [
      'adicional que não é do produto',
      [{ productId: 'burger', quantity: 1, addonIds: ['ao-ponto', 'xyz'] }],
    ],
    [
      'adicional repetido',
      [
        {
          productId: 'burger',
          quantity: 1,
          addonIds: ['ao-ponto', 'bacon', 'bacon'],
        },
      ],
    ],
  ])('recusa: %s', (_caso, items) => {
    expect(() => priceOrder([burger, racao, brinco], items)).toThrow(
      BadRequestException,
    );
  });

  it('não pede estoque de produto sem controle de estoque', () => {
    const result = priceOrder(
      [burger],
      [{ productId: 'burger', quantity: 5, addonIds: ['bem-passada'] }],
    );
    expect(result.stockNeeds).toEqual([]);
  });
});
