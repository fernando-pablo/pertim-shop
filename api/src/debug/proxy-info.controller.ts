import { Controller, Get, NotFoundException, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';

/** Cabeçalhos que hospedagens costumam usar para contar o IP de quem chamou. */
const CLIENT_IP_HEADERS = [
  'cf-connecting-ip',
  'true-client-ip',
  'x-real-ip',
] as const;

export interface ProxyInfo {
  forwardedFor: string[];
  clientIpHeaders: Record<string, string | null>;
  remoteAddress: string | null;
  ip: string | undefined;
  trustProxyHops: number;
}

/**
 * Medição dos intermediários (proxies) da hospedagem.
 *
 * Desligada, responde 404. Com PROXY_DEBUG=true, mostra o caminho que a
 * requisição fez até chegar na API. Com isso dá para escolher o
 * TRUST_PROXY_HOPS certo, e o limite de tentativas enxerga o IP de cada
 * pessoa. Só devolve dados da própria requisição de quem chamou.
 * Depois de medir, volta a ficar desligada.
 */
@ApiExcludeController()
@Controller('debug')
export class ProxyInfoController {
  constructor(private readonly config: ConfigService) {}

  @Get('proxy')
  show(@Req() request: Request): ProxyInfo {
    if (this.config.get<string>('PROXY_DEBUG') !== 'true') {
      throw new NotFoundException();
    }

    const clientIpHeaders: Record<string, string | null> = {};
    for (const name of CLIENT_IP_HEADERS) {
      clientIpHeaders[name] = headerText(request, name) || null;
    }

    return {
      forwardedFor: headerText(request, 'x-forwarded-for')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
      clientIpHeaders,
      remoteAddress: request.socket.remoteAddress ?? null,
      ip: request.ip,
      trustProxyHops: Number(this.config.get('TRUST_PROXY_HOPS') ?? 0),
    };
  }
}

function headerText(request: Request, name: string): string {
  const value = request.headers[name];
  return Array.isArray(value) ? value.join(',') : (value ?? '');
}
