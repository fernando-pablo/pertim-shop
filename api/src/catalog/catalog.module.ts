import { Module } from '@nestjs/common';
import { StoresModule } from '../stores/stores.module';
import { CatalogService } from './catalog.service';
import { CategoriesController } from './categories.controller';
import { ProductSearchService } from './product-search.service';
import { ProductsController } from './products.controller';
import { SearchController } from './search.controller';

@Module({
  imports: [StoresModule],
  controllers: [CategoriesController, ProductsController, SearchController],
  providers: [CatalogService, ProductSearchService],
})
export class CatalogModule {}
