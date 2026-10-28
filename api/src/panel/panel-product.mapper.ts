import { Prisma } from '../generated/prisma/client';
import { PanelProductDto } from './dto/panel-product.dto';

const byPosition = { orderBy: { position: 'asc' } } as const;

/** No painel aparece tudo, inclusive o que está desativado. */
export const panelProductInclude = {
  category: { select: { id: true, name: true } },
  variants: byPosition,
  addonGroups: { ...byPosition, include: { addons: byPosition } },
} satisfies Prisma.ProductInclude;

type PanelProductRow = Prisma.ProductGetPayload<{
  include: typeof panelProductInclude;
}>;

export function toPanelProduct(product: PanelProductRow): PanelProductDto {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    priceCents: product.priceCents,
    imageUrl: product.imageUrl,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    position: product.position,
    category: product.category,
    updatedAt: product.updatedAt,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      attributes: variant.attributes as Record<string, string>,
      priceCents: variant.priceCents,
      stock: variant.stock,
      isActive: variant.isActive,
      position: variant.position,
    })),
    addonGroups: product.addonGroups.map((group) => ({
      id: group.id,
      name: group.name,
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      addons: group.addons.map((addon) => ({
        id: addon.id,
        name: addon.name,
        priceCents: addon.priceCents,
        isActive: addon.isActive,
      })),
    })),
  };
}
