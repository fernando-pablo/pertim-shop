import { BadRequestException } from '@nestjs/common';
import { AddonGroupInputDto, VariantInputDto } from './dto/product-input.dto';

/** Confere se mínimo e máximo de cada grupo de adicionais fazem sentido. */
export function assertValidAddonGroups(groups: AddonGroupInputDto[]): void {
  for (const group of groups) {
    if (group.minSelect > group.maxSelect) {
      throw new BadRequestException(
        `"${group.name}": o mínimo não pode ser maior que o máximo`,
      );
    }
    if (group.maxSelect > group.addons.length) {
      throw new BadRequestException(
        `"${group.name}": o máximo não pode ser maior que a quantidade de opções`,
      );
    }
  }
}

/** Formato do Prisma para criar grupos de adicionais junto com o produto. */
export function addonGroupsCreateData(groups: AddonGroupInputDto[]) {
  return groups.map((group, position) => ({
    name: group.name,
    minSelect: group.minSelect,
    maxSelect: group.maxSelect,
    position,
    addons: {
      create: group.addons.map((addon, addonPosition) => ({
        name: addon.name,
        priceCents: addon.priceCents,
        position: addonPosition,
      })),
    },
  }));
}

/** Formato do Prisma para criar variações. */
export function variantCreateData(variant: VariantInputDto, position: number) {
  return {
    name: variant.name,
    attributes: variant.attributes ?? {},
    priceCents: variant.priceCents ?? null,
    stock: variant.stock ?? null,
    isActive: variant.isActive ?? true,
    position,
  };
}
