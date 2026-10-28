import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CategoryDto } from './dto/category.dto';

@ApiTags('Catálogo')
@Controller('stores/:slug/categories')
export class CategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Categorias da loja' })
  @ApiOkResponse({ type: [CategoryDto] })
  @ApiNotFoundResponse({ description: 'Loja não encontrada' })
  list(@Param('slug') slug: string): Promise<CategoryDto[]> {
    return this.catalog.listCategories(slug);
  }
}
