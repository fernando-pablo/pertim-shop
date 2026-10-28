import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthReport } from './dto/health-report.dto';
import { HealthService } from './health.service';

@ApiTags('Saúde')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Tudo certo: responde 200 com o relatório.
   * Banco ou Redis fora do ar: responde 503 (serviço indisponível) com o
   * mesmo relatório, para a hospedagem saber que algo está errado.
   */
  @Get()
  @ApiOperation({ summary: 'Confere se a API, o banco e o Redis estão ok' })
  @ApiOkResponse({ type: HealthReport })
  @ApiServiceUnavailableResponse({ description: 'Banco ou Redis fora do ar' })
  async check(): Promise<HealthReport> {
    const report = await this.healthService.check();

    if (report.status !== 'ok') {
      throw new ServiceUnavailableException(report);
    }

    return report;
  }
}
