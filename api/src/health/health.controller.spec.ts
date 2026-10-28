import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthReport, HealthService } from './health.service';

describe('HealthController', () => {
  const healthService = { check: jest.fn() };
  let controller: HealthController;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('devolve o relatório quando está tudo ok', async () => {
    const report: HealthReport = {
      status: 'ok',
      api: 'ok',
      database: 'ok',
      redis: 'ok',
    };
    healthService.check.mockResolvedValue(report);

    await expect(controller.check()).resolves.toEqual(report);
  });

  it('responde 503 quando algo está fora do ar', async () => {
    healthService.check.mockResolvedValue({
      status: 'error',
      api: 'ok',
      database: 'error',
      redis: 'ok',
    });

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
