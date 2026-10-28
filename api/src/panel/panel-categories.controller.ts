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
import {
  CreateCategoryDto,
  PanelCategoryDto,
  UpdateCategoryDto,
} from './dto/panel-category.dto';
import { PanelCategoriesService } from './panel-categories.service';

@ApiTags('Painel: categorias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('panel/categories')
export class PanelCategoriesController {
  constructor(private readonly categories: PanelCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Categorias da minha loja' })
  @ApiOkResponse({ type: [PanelCategoryDto] })
  list(@CurrentMerchant() auth: AuthMerchant): Promise<PanelCategoryDto[]> {
    return this.categories.list(auth.storeId);
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma categoria' })
  create(
    @CurrentMerchant() auth: AuthMerchant,
    @Body() dto: CreateCategoryDto,
  ): Promise<PanelCategoryDto> {
    return this.categories.create(auth.storeId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Renomeia ou muda a ordem de uma categoria' })
  update(
    @CurrentMerchant() auth: AuthMerchant,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<PanelCategoryDto> {
    return this.categories.update(auth.storeId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Apaga uma categoria (os produtos ficam sem categoria)',
  })
  remove(
    @CurrentMerchant() auth: AuthMerchant,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.categories.remove(auth.storeId, id);
  }
}
