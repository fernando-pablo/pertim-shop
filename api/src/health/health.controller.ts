import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { HealthReport, HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET /health
   * Tudo certo: responde 200 com o relatório.
   * Banco ou Redis fora do ar: responde 503 (serviço indisponível) com o
   * mesmo relatório, para a hospedagem saber que algo está errado.
   */
  @Get()
  async check(): Promise<HealthReport> {
    const report = await this.healthService.check();

    if (report.status !== 'ok') {
      throw new ServiceUnavailableException(report);
    }

    return report;
  }
}
