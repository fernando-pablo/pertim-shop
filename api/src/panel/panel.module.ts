import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StoresModule } from '../stores/stores.module';
import { PanelCategoriesController } from './panel-categories.controller';
import { PanelCategoriesService } from './panel-categories.service';
import { PanelOrdersController } from './panel-orders.controller';
import { PanelOrdersService } from './panel-orders.service';
import { PanelProductsController } from './panel-products.controller';
import { PanelProductsService } from './panel-products.service';
import { PanelStoreController } from './panel-store.controller';
import { PanelVariantsController } from './panel-variants.controller';
import { PanelVariantsService } from './panel-variants.service';

/**
 * Painel do lojista. Todas as rotas exigem login (JWT), e a loja vem
 * sempre do token, nunca do endereço: assim um lojista não tem como
 * mexer nos dados de outra loja.
 */
@Module({
  imports: [AuthModule, StoresModule],
  controllers: [
    PanelStoreController,
    PanelCategoriesController,
    PanelProductsController,
    PanelVariantsController,
    PanelOrdersController,
  ],
  providers: [
    PanelCategoriesService,
    PanelProductsService,
    PanelVariantsService,
    PanelOrdersService,
  ],
})
export class PanelModule {}
