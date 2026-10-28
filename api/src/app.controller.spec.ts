import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('retorna o nome da API e onde ficam o /health e o /docs', () => {
    expect(appController.getInfo()).toEqual({
      name: 'Pertim Shop API',
      slogan: "Tudo pertim d'ocê.",
      health: '/health',
      docs: '/docs',
    });
  });
});
