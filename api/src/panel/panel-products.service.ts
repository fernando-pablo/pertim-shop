import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  addonGroupsCreateData,
  assertValidAddonGroups,
  variantCreateData,
} from './addon-groups';
import { PanelProductDto } from './dto/panel-product.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product-input.dto';
import { panelProductInclude, toPanelProduct } from './panel-product.mapper';

/** Produtos da loja do lojista logado. Todo acesso filtra pelo storeId. */
@Injectable()
export class PanelProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(storeId: string): Promise<PanelProductDto[]> {
    const products = await this.prisma.product.findMany({
      where: { storeId },
      include: panelProductInclude,
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
    return products.map((product) => toPanelProduct(product));
  }

  async get(storeId: string, id: string): Promise<PanelProductDto> {
    const product = await this.prisma.product.findFirst({
      where: { id, storeId },
      include: panelProductInclude,
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return toPanelProduct(product);
  }

  async create(
    storeId: string,
    dto: CreateProductDto,
  ): Promise<PanelProductDto> {
    await this.ensureCategory(storeId, dto.categoryId);
    assertValidAddonGroups(dto.addonGroups ?? []);

    const product = await this.prisma.product.create({
      data: {
        storeId,
        categoryId: dto.categoryId ?? null,
        name: dto.name,
        description: dto.description ?? null,
        priceCents: dto.priceCents,
        imageUrl: dto.imageUrl ?? null,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        position: dto.position ?? 0,
        variants: { create: (dto.variants ?? []).map(variantCreateData) },
        addonGroups: { create: addonGroupsCreateData(dto.addonGroups ?? []) },
      },
      include: panelProductInclude,
    });
    return toPanelProduct(product);
  }

  async update(
    storeId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<PanelProductDto> {
    await this.ensureOwned(storeId, id);
    await this.ensureCategory(storeId, dto.categoryId);

    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: panelProductInclude,
    });
    return toPanelProduct(product);
  }

  /** Pedidos antigos continuam com o nome e o preço "congelados". */
  async remove(storeId: string, id: string): Promise<void> {
    await this.ensureOwned(storeId, id);
    await this.prisma.product.delete({ where: { id } });
  }

  async ensureOwned(storeId: string, id: string): Promise<void> {
    const found = await this.prisma.product.findFirst({
      where: { id, storeId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Produto não encontrado');
  }

  /** A categoria escolhida precisa ser da mesma loja. */
  private async ensureCategory(
    storeId: string,
    categoryId?: string | null,
  ): Promise<void> {
    if (!categoryId) return;
    const found = await this.prisma.category.findFirst({
      where: { id: categoryId, storeId },
      select: { id: true },
    });
    if (!found) throw new BadRequestException('Categoria não encontrada');
  }
}
