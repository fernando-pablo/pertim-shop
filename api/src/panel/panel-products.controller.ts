import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthMerchant } from '../auth/auth-merchant';
import { CurrentMerchant } from '../auth/current-merchant.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvalidateCatalogInterceptor } from '../cache/invalidate-catalog.interceptor';
import { PanelProductDto } from './dto/panel-product.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product-input.dto';
import { PanelProductsService } from './panel-products.service';

@ApiTags('Painel: produtos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
// Toda alteração feita aqui apaga o cache da vitrine da loja.
@UseInterceptors(InvalidateCatalogInterceptor)
@Controller('panel/products')
export class PanelProductsController {
  constructor(private readonly products: PanelProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Todos os produtos da minha loja, com estoque' })
  @ApiOkResponse({ type: [PanelProductDto] })
  list(@CurrentMerchant() auth: AuthMerchant): Promise<PanelProductDto[]> {
    return this.products.list(auth.storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Um produto da minha loja' })
  @ApiOkResponse({ type: PanelProductDto })
  get(
    @CurrentMerchant() auth: AuthMerchant,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PanelProductDto> {
    return this.products.get(auth.storeId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria um produto, com variações e adicionais' })
  create(
    @CurrentMerchant() auth: AuthMerchant,
    @Body() dto: CreateProductDto,
  ): Promise<PanelProductDto> {
    return this.products.create(auth.storeId, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Altera nome, preço, categoria, foto, destaque ou ativa/desativa',
  })
  update(
    @CurrentMerchant() auth: AuthMerchant,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<PanelProductDto> {
    return this.products.update(auth.storeId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Apaga um produto' })
  remove(
    @CurrentMerchant() auth: AuthMerchant,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.products.remove(auth.storeId, id);
  }
}
