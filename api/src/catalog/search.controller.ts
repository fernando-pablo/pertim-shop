import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { SearchQuery, SearchResultDto } from './dto/search.dto';

@ApiTags('Catálogo')
@Controller('stores/:slug/search')
export class SearchController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({
    summary:
      'Busca da vitrine: sem acento, várias palavras e nomes parecidos (erro de digitação)',
  })
  @ApiOkResponse({ type: SearchResultDto })
  @ApiNotFoundResponse({ description: 'Loja não encontrada' })
  search(
    @Param('slug') slug: string,
    @Query() query: SearchQuery,
  ): Promise<SearchResultDto> {
    return this.catalog.search(slug, query.q);
  }
}
