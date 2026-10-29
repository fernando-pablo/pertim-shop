import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { CatalogCache } from './catalog-cache.service';
import { InvalidateCatalogInterceptor } from './invalidate-catalog.interceptor';

describe('InvalidateCatalogInterceptor', () => {
  const cache = { invalidateStore: jest.fn() };
  const interceptor = new InvalidateCatalogInterceptor(
    cache as unknown as CatalogCache,
  );
  const merchant = { merchantId: 'lojista-1', storeId: 'loja-1' };

  const contextFor = (method: string) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ method, merchant }) }),
    }) as unknown as ExecutionContext;

  const handlerReturning = (body: unknown): CallHandler => ({
    handle: () => of(body),
  });

  beforeEach(() => {
    jest.resetAllMocks();
    cache.invalidateStore.mockResolvedValue(undefined);
  });

  it('depois de uma alteração que deu certo, apaga o cache da loja', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(
        contextFor('PATCH'),
        handlerReturning({ id: 'p1' }),
      ),
    );

    expect(result).toEqual({ id: 'p1' });
    expect(cache.invalidateStore).toHaveBeenCalledWith('loja-1');
  });

  it('leitura (GET) não apaga o cache', async () => {
    await lastValueFrom(
      interceptor.intercept(contextFor('GET'), handlerReturning([])),
    );

    expect(cache.invalidateStore).not.toHaveBeenCalled();
  });

  it('se a alteração der erro, não apaga o cache', async () => {
    const failing: CallHandler = {
      handle: () => throwError(() => new Error('Produto não encontrado')),
    };

    await expect(
      lastValueFrom(interceptor.intercept(contextFor('DELETE'), failing)),
    ).rejects.toThrow('Produto não encontrado');
    expect(cache.invalidateStore).not.toHaveBeenCalled();
  });
});
