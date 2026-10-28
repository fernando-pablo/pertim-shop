import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { CreateOrderItemDto } from './dto/create-order.dto';
import { OrderItemAddonDto } from './dto/order.dto';

/** O que buscar no banco para calcular o pedido. */
export const pricingInclude = {
  variants: { where: { isActive: true } },
  addonGroups: { include: { addons: { where: { isActive: true } } } },
} satisfies Prisma.ProductInclude;

export type PricingProduct = Prisma.ProductGetPayload<{
  include: typeof pricingInclude;
}>;

export interface PricedLine {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  addons: OrderItemAddonDto[];
  notes: string | null;
}

/** Quanto de estoque o pedido precisa de cada variação. */
export interface StockNeed {
  variantId: string;
  quantity: number;
  /** Ex.: "Ração Premium Cães Adultos (15 kg)", para a mensagem de erro */
  label: string;
}

export interface PricedOrder {
  lines: PricedLine[];
  subtotalCents: number;
  stockNeeds: StockNeed[];
}

/**
 * Calcula o pedido usando só os dados do banco: confere produto, variação e
 * adicionais (mínimo e máximo de cada grupo) e soma os preços.
 * Função "pura": não acessa o banco, por isso é fácil de testar.
 */
export function priceOrder(
  products: PricingProduct[],
  items: CreateOrderItemDto[],
): PricedOrder {
  const byId = new Map(products.map((product) => [product.id, product]));
  const stock = new Map<string, StockNeed>();

  const lines = items.map((item, index) => {
    const product = byId.get(item.productId);
    if (!product) {
      throw new BadRequestException(
        `O item ${index + 1} do carrinho não está mais disponível`,
      );
    }

    const variant = pickVariant(product, item.variantId);
    const addons = pickAddons(product, item.addonIds ?? []);
    const unitPriceCents =
      (variant?.priceCents ?? product.priceCents) +
      addons.reduce((sum, addon) => sum + addon.priceCents, 0);

    if (variant && variant.stock !== null) {
      const need = stock.get(variant.id) ?? {
        variantId: variant.id,
        quantity: 0,
        label: variantLabel(product.name, variant.name),
      };
      need.quantity += item.quantity;
      stock.set(variant.id, need);
    }

    return {
      productId: product.id,
      variantId: variant?.id ?? null,
      productName: product.name,
      variantName: variant?.name ?? null,
      quantity: item.quantity,
      unitPriceCents,
      totalCents: unitPriceCents * item.quantity,
      addons,
      notes: item.notes || null,
    };
  });

  return {
    lines,
    subtotalCents: lines.reduce((sum, line) => sum + line.totalCents, 0),
    stockNeeds: [...stock.values()],
  };
}

function pickVariant(product: PricingProduct, variantId?: string) {
  const { variants } = product;
  if (variants.length === 0) {
    if (variantId) {
      throw new BadRequestException(`${product.name} não tem variações`);
    }
    return null;
  }
  // Com uma variação só, ela é escolhida automaticamente.
  if (!variantId && variants.length === 1) {
    return variants[0];
  }
  const variant = variants.find((option) => option.id === variantId);
  if (!variant) {
    throw new BadRequestException(
      `Escolha uma opção válida de ${product.name}`,
    );
  }
  return variant;
}

function pickAddons(
  product: PricingProduct,
  addonIds: string[],
): OrderItemAddonDto[] {
  if (new Set(addonIds).size !== addonIds.length) {
    throw new BadRequestException(`Adicional repetido em ${product.name}`);
  }

  const chosen: OrderItemAddonDto[] = [];
  const found = new Set<string>();
  for (const group of product.addonGroups) {
    const selected = group.addons.filter((addon) =>
      addonIds.includes(addon.id),
    );
    if (selected.length < group.minSelect) {
      throw new BadRequestException(
        `Escolha ${group.minSelect} em "${group.name}" (${product.name})`,
      );
    }
    if (selected.length > group.maxSelect) {
      throw new BadRequestException(
        `Escolha no máximo ${group.maxSelect} em "${group.name}" (${product.name})`,
      );
    }
    for (const addon of selected) {
      found.add(addon.id);
      chosen.push({ name: addon.name, priceCents: addon.priceCents });
    }
  }

  if (found.size !== addonIds.length) {
    throw new BadRequestException(`Adicional inválido para ${product.name}`);
  }
  return chosen;
}

function variantLabel(productName: string, variantName: string): string {
  return `${productName} (${variantName})`;
}
