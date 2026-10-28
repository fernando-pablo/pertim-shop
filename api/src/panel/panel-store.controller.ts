import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthMerchant } from '../auth/auth-merchant';
import { CurrentMerchant } from '../auth/current-merchant.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { resetDemoStore } from '../demo/seed-demo';
import { PrismaService } from '../prisma/prisma.service';
import { StoreDto } from '../stores/dto/store.dto';
import { StoresService } from '../stores/stores.service';
import { ResetDemoResultDto } from './dto/reset-demo.dto';

@ApiTags('Painel: loja')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('panel')
export class PanelStoreController {
  constructor(
    private readonly stores: StoresService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get('store')
  @ApiOperation({ summary: 'Dados da minha loja' })
  @ApiOkResponse({ type: StoreDto })
  getStore(@CurrentMerchant() auth: AuthMerchant): Promise<StoreDto> {
    return this.stores.getById(auth.storeId);
  }

  @Post('demo/reset')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Restaura os dados originais (só em lojas de demonstração)',
  })
  @ApiOkResponse({ type: ResetDemoResultDto })
  @ApiForbiddenResponse({ description: 'A loja não é de demonstração' })
  async resetDemo(
    @CurrentMerchant() auth: AuthMerchant,
  ): Promise<ResetDemoResultDto> {
    const store = await this.stores.getById(auth.storeId);
    const restored = store.isDemo
      ? await resetDemoStore(
          this.prisma,
          store.slug,
          this.config.get<string>('DEMO_PASSWORD') ?? 'pertim-demo',
        )
      : null;

    if (!restored) {
      throw new ForbiddenException(
        'Só lojas de demonstração podem ser restauradas',
      );
    }
    return {
      message: `${restored.name} voltou aos dados originais`,
      products: restored.products.length,
    };
  }
}
