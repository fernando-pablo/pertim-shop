import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoresService } from '../stores/stores.service';
import {
  productDetailInclude,
  productSummaryInclude,
  toProductDetail,
  toProductSummary,
} from './catalog.mapper';
import { CategoryDto } from './dto/category.dto';
import { ListProductsQuery } from './dto/list-products.query';
import { ProductDetailDto, ProductSummaryDto } from './dto/product.dto';

/**
 * Catálogo público de uma loja: categorias e produtos.
 * Toda consulta começa pela loja e filtra pelo id dela (storeId).
 */
@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stores: StoresService,
  ) {}

  async listCategories(slug: string): Promise<CategoryDto[]> {
    const store = await this.stores.findActiveBySlug(slug);

    const categories = await this.prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      productCount: category._count.products,
    }));
  }

  async listProducts(
    slug: string,
    query: ListProductsQuery,
  ): Promise<ProductSummaryDto[]> {
    const store = await this.stores.findActiveBySlug(slug);

    const where: Prisma.ProductWhereInput = {
      storeId: store.id,
      isActive: true,
      ...(query.category && { categoryId: query.category }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const products = await this.prisma.product.findMany({
      where,
      include: productSummaryInclude,
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });

    return products.map((product) => toProductSummary(product));
  }

  async getProduct(slug: string, productId: string): Promise<ProductDetailDto> {
    const store = await this.stores.findActiveBySlug(slug);

    // Filtrar também pelo storeId garante que o produto de outra loja
    // nunca aparece aqui, mesmo que alguém tente com o id certo.
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId: store.id, isActive: true },
      include: productDetailInclude,
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    return toProductDetail(product);
  }
}
