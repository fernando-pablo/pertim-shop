import { Logger } from '@nestjs/common';

/**
 * Aviso no log quando o Redis falha. Com o Redis fora do ar, toda
 * requisição falharia; para não lotar o log, avisa no máximo uma vez por
 * minuto.
 */
export class RedisWarning {
  private readonly logger: Logger;
  private lastWarningAt = 0;

  constructor(
    context: string,
    private readonly text: string,
  ) {
    this.logger = new Logger(context);
  }

  warn(error: unknown): void {
    const now = Date.now();
    if (now - this.lastWarningAt < 60_000) return;
    this.lastWarningAt = now;
    const message = error instanceof Error ? error.message : String(error);
    this.logger.warn(`${this.text}: ${message}`);
  }
}
