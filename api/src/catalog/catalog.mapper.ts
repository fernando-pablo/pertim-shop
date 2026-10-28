import { Prisma } from '../generated/prisma/client';
import {
  ProductDetailDto,
  ProductSummaryDto,
  VariantDto,
} from './dto/product.dto';

/** A partir de quantas unidades a vitrine mostra "últimas unidades". */
export const LOW_STOCK_LIMIT = 3;

const activeByPosition = {
  where: { isActive: true },
  orderBy: { position: 'asc' },
} as const;

/** O que buscar no banco para a lista de produtos. */
export const productSummaryInclude = {
  category: { select: { id: true, name: true } },
  variants: activeByPosition,
} satisfies Prisma.ProductInclude;

/** O que buscar no banco para a página do produto. */
export const productDetailInclude = {
  ...productSummaryInclude,
  addonGroups: {
    orderBy: { position: 'asc' },
    include: { addons: activeByPosition },
  },
} satisfies Prisma.ProductInclude;

type ProductWithSummary = Prisma.ProductGetPayload<{
  include: typeof productSummaryInclude;
}>;
type ProductWithDetail = Prisma.ProductGetPayload<{
  include: typeof productDetailInclude;
}>;
type VariantRow = ProductWithSummary['variants'][number];

export function toProductSummary(
  product: ProductWithSummary,
): ProductSummaryDto {
  const prices = product.variants.length
    ? product.variants.map((variant) => effectivePrice(product, variant))
    : [product.priceCents];

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    category: product.category,
    isFeatured: product.isFeatured,
    minPriceCents: Math.min(...prices),
    maxPriceCents: Math.max(...prices),
    // Com uma variação só, a vitrine escolhe sozinha; não precisa perguntar.
    hasVariants: product.variants.length > 1,
    // Sem variações = produto sem controle de estoque (ex.: lanche feito na hora)
    available:
      product.variants.length === 0 || product.variants.some(isAvailable),
  };
}

export function toProductDetail(product: ProductWithDetail): ProductDetailDto {
  return Object.assign(toProductSummary(product), {
    variants: product.variants.map((variant) => toVariant(product, variant)),
    addonGroups: product.addonGroups.map((group) => ({
      id: group.id,
      name: group.name,
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      addons: group.addons.map((addon) => ({
        id: addon.id,
        name: addon.name,
        priceCents: addon.priceCents,
      })),
    })),
  });
}

function toVariant(
  product: ProductWithSummary,
  variant: VariantRow,
): VariantDto {
  return {
    id: variant.id,
    name: variant.name,
    attributes: variant.attributes as Record<string, string>,
    priceCents: effectivePrice(product, variant),
    available: isAvailable(variant),
    lowStock:
      variant.stock !== null &&
      variant.stock > 0 &&
      variant.stock <= LOW_STOCK_LIMIT,
  };
}

/** Preço da variação, ou o preço do produto quando ela não tem preço próprio. */
function effectivePrice(
  product: ProductWithSummary,
  variant: VariantRow,
): number {
  return variant.priceCents ?? product.priceCents;
}

/** Estoque vazio (null) = não controla estoque, então está disponível. */
function isAvailable(variant: VariantRow): boolean {
  return variant.stock === null || variant.stock > 0;
}
