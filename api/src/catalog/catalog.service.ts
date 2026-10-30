import { Injectable, NotFoundException } from '@nestjs/common';
import { CatalogCache } from '../cache/catalog-cache.service';
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
import { SearchResultDto } from './dto/search.dto';
import { ProductSearchService } from './product-search.service';
import { searchWords } from './search-words';

/**
 * Catálogo público de uma loja: categorias e produtos.
 * Toda consulta começa pela loja e filtra pelo id dela (storeId).
 * As respostas mais pedidas ficam no cache (ver CatalogCache).
 */
@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stores: StoresService,
    private readonly cache: CatalogCache,
    private readonly searcher: ProductSearchService,
  ) {}

  async listCategories(slug: string): Promise<CategoryDto[]> {
    const store = await this.stores.findActiveBySlug(slug);

    return this.cache.catalog(store.id, 'categories', async () => {
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
    });
  }

  /**
   * Só a lista completa vai para o cache: é o que todo cliente vê ao abrir
   * a loja. Busca e filtro vão direto ao banco; assim ninguém consegue
   * encher a memória do Redis inventando buscas diferentes.
   */
  async listProducts(
    slug: string,
    query: ListProductsQuery,
  ): Promise<ProductSummaryDto[]> {
    const store = await this.stores.findActiveBySlug(slug);

    if (!query.category && !query.search) {
      return this.cache.catalog(store.id, 'products', () =>
        this.findProducts(store.id, query),
      );
    }
    return this.findProducts(store.id, query);
  }

  async getProduct(slug: string, productId: string): Promise<ProductDetailDto> {
    const store = await this.stores.findActiveBySlug(slug);

    // Produto que não existe dá erro e não vai para o cache.
    return this.cache.catalog(store.id, `product:${productId}`, async () => {
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
    });
  }

  /**
   * Busca da vitrine: sem acento, várias palavras e, se nada aparecer,
   * nomes parecidos (erro de digitação). Vai sempre direto ao banco.
   */
  async search(slug: string, text: string): Promise<SearchResultDto> {
    const store = await this.stores.findActiveBySlug(slug);
    const hits = await this.searcher.search(store.id, text);
    return { match: hits.match, products: await this.byIds(hits.ids) };
  }

  private async findProducts(
    storeId: string,
    query: ListProductsQuery,
  ): Promise<ProductSummaryDto[]> {
    // ?search= usa a mesma busca sem acento (só a parte "exata").
    const words = query.search ? searchWords(query.search) : [];
    if (words.length > 0) {
      const ids = await this.searcher.findExact(storeId, words);
      const found = await this.byIds(ids);
      return query.category
        ? found.filter((product) => product.category?.id === query.category)
        : found;
    }

    const products = await this.prisma.product.findMany({
      where: {
        storeId,
        isActive: true,
        ...(query.category && { categoryId: query.category }),
      },
      include: productSummaryInclude,
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
    return products.map((product) => toProductSummary(product));
  }

  /** Produtos na mesma ordem dos ids (a ordem de importância da busca). */
  private async byIds(ids: string[]): Promise<ProductSummaryDto[]> {
    if (ids.length === 0) return [];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: productSummaryInclude,
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    return ids.flatMap((id) => {
      const product = byId.get(id);
      return product ? [toProductSummary(product)] : [];
    });
  }
}
