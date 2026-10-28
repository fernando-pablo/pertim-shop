import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: 'segredo-de-teste' });
  const guard = new JwtAuthGuard(jwt);

  function contextWith(authorization?: string) {
    const request: Record<string, unknown> = {
      headers: authorization ? { authorization } : {},
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { context, request };
  }

  it('deixa passar com token válido e guarda o lojista na requisição', async () => {
    const token = await jwt.signAsync({ sub: 'lojista-1', storeId: 'loja-1' });
    const { context, request } = contextWith(`Bearer ${token}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.merchant).toEqual({
      merchantId: 'lojista-1',
      storeId: 'loja-1',
    });
  });

  it('barra quem não mandou token', async () => {
    await expect(
      guard.canActivate(contextWith().context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('barra token assinado com outra chave', async () => {
    const forged = await new JwtService({ secret: 'outra-chave' }).signAsync({
      sub: 'hacker',
      storeId: 'loja-1',
    });
    await expect(
      guard.canActivate(contextWith(`Bearer ${forged}`).context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
