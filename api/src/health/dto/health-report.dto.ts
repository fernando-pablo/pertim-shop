import { ApiProperty } from '@nestjs/swagger';

export type CheckStatus = 'ok' | 'error';

const statusProperty = { enum: ['ok', 'error'] } as const;

/** Relatório de saúde da API. */
export class HealthReport {
  @ApiProperty(statusProperty)
  status: CheckStatus;
  @ApiProperty(statusProperty)
  api: CheckStatus;
  @ApiProperty(statusProperty)
  database: CheckStatus;
  @ApiProperty(statusProperty)
  redis: CheckStatus;
}
