import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { cacheKeys } from '../cache/cache-keys';
import { CatalogCache } from '../cache/catalog-cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { resetDemoStore } from './seed-demo';

/** Primeira checagem: 15 segundos depois de ligar (o Redis já conectou). */
const FIRST_CHECK_MS = 15_000;
/** Depois, confere a cada hora. */
const CHECK_EVERY_MS = 60 * 60 * 1000;

/**
 * Limpeza automática das lojas de demonstração.
 *
 * Todo visitante usa as mesmas lojas de demonstração, então os pedidos de
 * teste (com nome e telefone) e as mudanças no painel se acumulam. Uma vez
 * a cada X horas (DEMO_RESET_HOURS, padrão 24; 0 desliga), cada loja de
 * demonstração volta ao original: pedidos apagados, produtos e estoque de
 * volta. Lojas de verdade nunca são tocadas.
 */
@Injectable()
export class DemoResetService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger('Demonstração');
  private readonly hours: number;
  private readonly timers: NodeJS.Timeout[] = [];

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly cache: CatalogCache,
    private readonly config: ConfigService,
  ) {
    const hours = Number(config.get<string>('DEMO_RESET_HOURS') ?? 24);
    this.hours = Number.isFinite(hours) && hours > 0 ? hours : 0;
  }

  /** Nos testes automáticos (NODE_ENV=test) a limpeza fica desligada. */
  onApplicationBootstrap(): void {
    if (this.hours === 0 || process.env.NODE_ENV === 'test') return;
    const check = () => void this.run();
    this.timers.push(
      setTimeout(check, FIRST_CHECK_MS).unref(),
      setInterval(check, CHECK_EVERY_MS).unref(),
    );
  }

  onApplicationShutdown(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
  }

  /** Restaura as lojas de demonstração cujo prazo já passou. */
  async run(): Promise<string[]> {
    const stores = await this.prisma.store.findMany({
      where: { isDemo: true },
      select: { slug: true },
    });
    const restored: string[] = [];
    for (const { slug } of stores) {
      if (!(await this.claim(slug))) continue;
      try {
        await this.restore(slug);
        restored.push(slug);
      } catch (error) {
        // Deu errado: solta a vez, para tentar de novo na próxima hora.
        await this.redis.del(cacheKeys.demoReset(slug)).catch(() => 0);
        this.logger.warn(
          `Não foi possível restaurar ${slug}: ${String(error)}`,
        );
      }
    }
    if (restored.length > 0) {
      this.logger.log(`Lojas restauradas: ${restored.join(', ')}`);
    }
    return restored;
  }

  /**
   * "Pega a vez" de restaurar a loja com um único comando do Redis:
   * SET ... NX (só grava se a chave não existe) EX (a chave some depois de
   * X horas). Com várias cópias da API rodando, só uma consegue gravar, e
   * a loja é restaurada uma vez só. Redis fora do ar: não restaura.
   */
  async claim(slug: string): Promise<boolean> {
    try {
      const answer = await this.redis.set(
        cacheKeys.demoReset(slug),
        new Date().toISOString(),
        'EX',
        Math.round(this.hours * 60 * 60),
        'NX',
      );
      return answer === 'OK';
    } catch {
      return false;
    }
  }

  /** Volta a loja ao original e apaga o cache da vitrine dela. */
  async restore(slug: string): Promise<void> {
    const password = this.config.get<string>('DEMO_PASSWORD') ?? 'pertim-demo';
    const demo = await resetDemoStore(this.prisma, slug, password);
    if (!demo) return;
    const store = await this.prisma.store.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (store) await this.cache.invalidateStore(store.id);
  }
}
