import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  addonGroupsCreateData,
  assertValidAddonGroups,
  variantCreateData,
} from './addon-groups';
import { PanelProductDto } from './dto/panel-product.dto';
import {
  ReplaceAddonGroupsDto,
  UpdateVariantDto,
  VariantInputDto,
} from './dto/product-input.dto';
import { PanelProductsService } from './panel-products.service';

/**
 * Variações (tamanho, cor, peso... com estoque) e adicionais de um produto.
 * Antes de mexer, sempre confere se o produto é da loja do lojista logado.
 */
@Injectable()
export class PanelVariantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: PanelProductsService,
  ) {}

  async addVariant(
    storeId: string,
    productId: string,
    dto: VariantInputDto,
  ): Promise<PanelProductDto> {
    await this.products.ensureOwned(storeId, productId);
    const position = await this.prisma.productVariant.count({
      where: { productId },
    });
    await this.prisma.productVariant.create({
      data: { productId, ...variantCreateData(dto, position) },
    });
    return this.products.get(storeId, productId);
  }

  /** Usado também para ajustar o estoque: { "stock": 10 } */
  async updateVariant(
    storeId: string,
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ): Promise<PanelProductDto> {
    await this.ensureVariant(storeId, productId, variantId);
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: dto,
    });
    return this.products.get(storeId, productId);
  }

  async removeVariant(
    storeId: string,
    productId: string,
    variantId: string,
  ): Promise<PanelProductDto> {
    await this.ensureVariant(storeId, productId, variantId);
    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return this.products.get(storeId, productId);
  }

  /** Troca todos os grupos de adicionais do produto de uma vez. */
  async replaceAddonGroups(
    storeId: string,
    productId: string,
    dto: ReplaceAddonGroupsDto,
  ): Promise<PanelProductDto> {
    await this.products.ensureOwned(storeId, productId);
    assertValidAddonGroups(dto.groups);

    await this.prisma.$transaction([
      this.prisma.addonGroup.deleteMany({ where: { productId } }),
      ...addonGroupsCreateData(dto.groups).map((group) =>
        this.prisma.addonGroup.create({ data: { productId, ...group } }),
      ),
    ]);
    return this.products.get(storeId, productId);
  }

  private async ensureVariant(
    storeId: string,
    productId: string,
    variantId: string,
  ): Promise<void> {
    const found = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId, product: { storeId } },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Variação não encontrada');
  }
}
