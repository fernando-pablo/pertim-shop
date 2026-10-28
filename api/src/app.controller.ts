import { Controller, Get } from '@nestjs/common';

export interface ApiInfo {
  name: string;
  slogan: string;
  health: string;
}

@Controller()
export class AppController {
  /** Página inicial da API: só diz quem ela é e onde ver se está saudável. */
  @Get()
  getInfo(): ApiInfo {
    return {
      name: 'Pertim Shop API',
      slogan: "Tudo pertim d'ocê.",
      health: '/health',
    };
  }
}
