import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthMerchant, JwtPayload } from './auth-merchant';

export type AuthenticatedRequest = Request & { merchant: AuthMerchant };

/**
 * "Porteiro" das rotas do painel: só deixa passar quem manda um token válido
 * no cabeçalho "Authorization: Bearer <token>".
 * A API não guarda sessão na memória (API sem estado): tudo está no token.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Faça login para continuar');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      request.merchant = { merchantId: payload.sub, storeId: payload.storeId };
      return true;
    } catch {
      throw new UnauthorizedException('Sessão expirada. Faça login de novo');
    }
  }
}
