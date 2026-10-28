import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { StoreDto, StoreSummaryDto } from './dto/store.dto';
import { StoresService } from './stores.service';

@ApiTags('Lojas')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as lojas ativas da plataforma' })
  @ApiOkResponse({ type: [StoreSummaryDto] })
  list(): Promise<StoreSummaryDto[]> {
    return this.storesService.list();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Dados de uma loja, com o tema (visual)' })
  @ApiOkResponse({ type: StoreDto })
  @ApiNotFoundResponse({ description: 'Loja não encontrada' })
  getBySlug(@Param('slug') slug: string): Promise<StoreDto> {
    return this.storesService.getBySlug(slug);
  }
}
