import { toProductDetail, toProductSummary } from './catalog.mapper';

type Variant = {
  id: string;
  name: string;
  attributes: Record<string, string>;
  priceCents: number | null;
  stock: number | null;
};

/** Monta um produto "de mentira" no formato que vem do banco. */
function makeProduct(variants: Variant[] = []) {
  return {
    id: 'p1',
    storeId: 's1',
    categoryId: 'c1',
    name: 'Vestido',
    description: 'Vestido de linho',
    priceCents: 10000,
    imageUrl: null,
    isActive: true,
    isFeatured: false,
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'c1', name: 'Vestidos' },
    variants: variants.map((variant, position) => ({
      ...variant,
      productId: 'p1',
      isActive: true,
      position,
    })),
    addonGroups: [],
  };
}

function variant(id: string, overrides: Partial<Variant> = {}): Variant {
  return {
    id,
    name: id,
    attributes: {},
    priceCents: null,
    stock: 5,
    ...overrides,
  };
}

describe('catalog.mapper', () => {
  it('produto sem variações: preço único e sempre disponível', () => {
    const summary = toProductSummary(makeProduct());

    expect(summary).toMatchObject({
      minPriceCents: 10000,
      maxPriceCents: 10000,
      hasVariants: false,
      available: true,
    });
  });

  it('variações com preços diferentes mostram a faixa de preço', () => {
    const summary = toProductSummary(
      makeProduct([
        variant('1kg', { priceCents: 3490 }),
        variant('15kg', { priceCents: 32990 }),
      ]),
    );

    expect(summary.minPriceCents).toBe(3490);
    expect(summary.maxPriceCents).toBe(32990);
    expect(summary.hasVariants).toBe(true);
  });

  it('variação sem preço próprio usa o preço do produto', () => {
    const detail = toProductDetail(makeProduct([variant('M')]));

    expect(detail.variants[0].priceCents).toBe(10000);
  });

  it('fica indisponível quando todas as variações estão sem estoque', () => {
    const summary = toProductSummary(
      makeProduct([variant('P', { stock: 0 }), variant('M', { stock: 0 })]),
    );

    expect(summary.available).toBe(false);
  });

  it('avisa "últimas unidades" sem mostrar o estoque exato', () => {
    const detail = toProductDetail(
      makeProduct([
        variant('P', { stock: 2 }),
        variant('M', { stock: 10 }),
        variant('G', { stock: 0 }),
      ]),
    );

    expect(detail.variants.map((v) => v.lowStock)).toEqual([
      true,
      false,
      false,
    ]);
    expect(detail.variants.map((v) => v.available)).toEqual([
      true,
      true,
      false,
    ]);
    expect(detail.variants[0]).not.toHaveProperty('stock');
  });

  it('com uma variação só, não pede para o cliente escolher', () => {
    const summary = toProductSummary(makeProduct([variant('Unidade')]));

    expect(summary.hasVariants).toBe(false);
  });
});
