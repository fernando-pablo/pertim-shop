import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module';
import { CatalogService } from './catalog.service';
import { CategoriesController } from './categories.controller';
import { ProductsController } from './products.controller';

@Module({
  imports: [StoresModule],
  controllers: [CategoriesController, ProductsController],
  providers: [CatalogService],
})
export class CatalogModule {}
