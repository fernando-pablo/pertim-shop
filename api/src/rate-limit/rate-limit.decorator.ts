import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { RateLimitGuard } from './rate-limit.guard';
import { RATE_LIMIT_RULE, RateLimitRule } from './rate-limit.rule';

/**
 * Limita quantas vezes o mesmo IP pode chamar a rota. Exemplo:
 *
 *   @RateLimit({ name: 'login', limit: 10, windowSeconds: 15 * 60 })
 *
 * = no máximo 10 tentativas de login a cada 15 minutos.
 * Junta três coisas num decorator só: a regra, o guard que conta e o
 * aviso na documentação (Swagger).
 */
export function RateLimit(rule: RateLimitRule) {
  const minutes = Math.round(rule.windowSeconds / 60);
  return applyDecorators(
    SetMetadata(RATE_LIMIT_RULE, rule),
    UseGuards(RateLimitGuard),
    ApiTooManyRequestsResponse({
      description: `Muitas tentativas: no máximo ${rule.limit} a cada ${minutes} minutos`,
    }),
  );
}
