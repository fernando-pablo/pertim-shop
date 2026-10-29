import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { cacheKeys } from '../cache/cache-keys';
import { REDIS_CLIENT } from '../redis/redis.module';
import { RedisWarning } from '../redis/redis-warning';
import { RATE_LIMIT_RULE, RateLimitRule } from './rate-limit.rule';

interface Usage {
  count: number;
  secondsLeft: number;
}

/**
 * Limite de tentativas: conta no Redis quantas vezes o mesmo IP chamou a
 * rota. Passou do limite, responde 429 ("muitas tentativas") até a janela
 * de tempo acabar. Protege o login contra quem tenta adivinhar senhas e
 * os pedidos contra robôs.
 *
 * Se o Redis falhar, deixa passar: melhor a loja continuar vendendo do que
 * travar todo mundo por causa da proteção.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly warning = new RedisWarning(
    'RateLimit',
    'Limite de tentativas desligado (Redis indisponível)',
  );

  constructor(
    private readonly reflector: Reflector,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rule = this.reflector.get<RateLimitRule | undefined>(
      RATE_LIMIT_RULE,
      context.getHandler(),
    );
    if (!rule) return true;

    const http = context.switchToHttp();
    const key = cacheKeys.rateLimit(
      rule.name,
      clientKey(http.getRequest<Request>()),
    );
    const usage = await this.count(key, rule.windowSeconds);
    if (!usage || usage.count <= rule.limit) return true;

    http
      .getResponse<Response>()
      .setHeader('Retry-After', String(usage.secondsLeft));
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: `Muitas tentativas. Tente de novo em ${waitText(usage.secondsLeft)}.`,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  /**
   * Soma 1 no contador. Na primeira tentativa, o contador nasce com prazo
   * de validade (a janela); quando vence, o Redis apaga sozinho e a
   * contagem recomeça. MULTI faz os três comandos rodarem juntos, sem
   * outra requisição no meio.
   */
  private async count(
    key: string,
    windowSeconds: number,
  ): Promise<Usage | null> {
    try {
      const results = await this.redis
        .multi()
        .set(key, 0, 'EX', windowSeconds, 'NX')
        .incr(key)
        .ttl(key)
        .exec();
      if (!results || results.some(([error]) => error)) {
        throw new Error('o Redis não completou a contagem');
      }
      const count = Number(results[1][1]);
      const ttl = Number(results[2][1]);
      return { count, secondsLeft: ttl > 0 ? ttl : windowSeconds };
    } catch (error) {
      this.warning.warn(error);
      return null;
    }
  }
}

/** Quem está chamando: o IP e, nas rotas de uma loja, o endereço dela. */
function clientKey(request: Request): string {
  const ip = request.ip ?? 'sem-ip';
  const slug = request.params?.slug;
  return typeof slug === 'string' && slug ? `${slug}:${ip}` : ip;
}

function waitText(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? '1 minuto' : `${minutes} minutos`;
}
