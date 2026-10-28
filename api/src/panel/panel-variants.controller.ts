import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthMerchant } from '../auth/auth-merchant';
import { CurrentMerchant } from '../auth/current-merchant.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PanelProductDto } from './dto/panel-product.dto';
import {
  ReplaceAddonGroupsDto,
  UpdateVariantDto,
  VariantInputDto,
} from './dto/product-input.dto';
import { PanelVariantsService } from './panel-variants.service';

@ApiTags('Painel: variações, estoque e adicionais')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('panel/products/:productId')
export class PanelVariantsController {
  constructor(private readonly variants: PanelVariantsService) {}

  @Post('variants')
  @ApiOperation({ summary: 'Adiciona uma variação (ex.: tamanho GG)' })
  add(
    @CurrentMerchant() auth: AuthMerchant,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: VariantInputDto,
  ): Promise<PanelProductDto> {
    return this.variants.addVariant(auth.storeId, productId, dto);
  }

  @Patch('variants/:variantId')
  @ApiOperation({ summary: 'Altera uma variação, inclusive o estoque' })
  update(
    @CurrentMerchant() auth: AuthMerchant,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<PanelProductDto> {
    return this.variants.updateVariant(auth.storeId, productId, variantId, dto);
  }

  @Delete('variants/:variantId')
  @ApiOperation({ summary: 'Apaga uma variação' })
  remove(
    @CurrentMerchant() auth: AuthMerchant,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ): Promise<PanelProductDto> {
    return this.variants.removeVariant(auth.storeId, productId, variantId);
  }

  @Put('addon-groups')
  @ApiOperation({ summary: 'Troca todos os grupos de adicionais do produto' })
  replaceAddonGroups(
    @CurrentMerchant() auth: AuthMerchant,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: ReplaceAddonGroupsDto,
  ): Promise<PanelProductDto> {
    return this.variants.replaceAddonGroups(auth.storeId, productId, dto);
  }
}
