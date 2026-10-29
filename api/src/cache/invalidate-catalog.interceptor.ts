import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { concatMap, Observable } from 'rxjs';
import type { AuthMerchant } from '../auth/auth-merchant';
import { CatalogCache } from './catalog-cache.service';

type PanelRequest = Request & { merchant?: AuthMerchant };

/**
 * Usado nas rotas do painel que mexem no catálogo. Depois que uma alteração
 * (POST, PUT, PATCH ou DELETE) dá certo, apaga o cache da loja do lojista.
 * Assim, a vitrine mostra a mudança na hora.
 *
 * Fica num lugar só, em vez de repetido em cada serviço: rota nova do
 * painel já nasce apagando o cache, sem ninguém precisar lembrar.
 */
@Injectable()
export class InvalidateCatalogInterceptor implements NestInterceptor {
  constructor(private readonly cache: CatalogCache) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<PanelRequest>();
    const storeId = request.merchant?.storeId;

    // Leitura não muda nada; e se der erro, nada foi gravado.
    if (request.method === 'GET' || !storeId) {
      return next.handle();
    }

    return next.handle().pipe(
      concatMap(async (body: unknown) => {
        await this.cache.invalidateStore(storeId);
        return body;
      }),
    );
  }
}
