import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { ListProductsQuery } from './dto/list-products.query';
import { ProductDetailDto, ProductSummaryDto } from './dto/product.dto';

@ApiTags('Catálogo')
@Controller('stores/:slug/products')
export class ProductsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({
    summary: 'Produtos da loja, com filtro por categoria e busca',
  })
  @ApiOkResponse({ type: [ProductSummaryDto] })
  @ApiNotFoundResponse({ description: 'Loja não encontrada' })
  list(
    @Param('slug') slug: string,
    @Query() query: ListProductsQuery,
  ): Promise<ProductSummaryDto[]> {
    return this.catalog.listProducts(slug, query);
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Produto completo, com variações e adicionais' })
  @ApiOkResponse({ type: ProductDetailDto })
  @ApiNotFoundResponse({ description: 'Loja ou produto não encontrado' })
  get(
    @Param('slug') slug: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<ProductDetailDto> {
    return this.catalog.getProduct(slug, productId);
  }
}
