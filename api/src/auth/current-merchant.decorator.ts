import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthMerchant } from './auth-merchant';
import { AuthenticatedRequest } from './jwt-auth.guard';

/**
 * Entrega ao controller o lojista logado (e a loja dele).
 * Uso: `list(@CurrentMerchant() auth: AuthMerchant)`
 */
export const CurrentMerchant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthMerchant =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().merchant,
);
