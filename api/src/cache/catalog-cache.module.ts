import { Global, Module } from '@nestjs/common';
import { CatalogCache } from './catalog-cache.service';
import { InvalidateCatalogInterceptor } from './invalidate-catalog.interceptor';

/** Cache da vitrine no Redis. Global: qualquer módulo pode usar. */
@Global()
@Module({
  providers: [CatalogCache, InvalidateCatalogInterceptor],
  exports: [CatalogCache, InvalidateCatalogInterceptor],
})
export class CatalogCacheModule {}
