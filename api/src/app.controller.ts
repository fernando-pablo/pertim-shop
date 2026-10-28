import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiInfo } from './app-info.dto';

@ApiTags('Início')
@Controller()
export class AppController {
  /** Página inicial da API: diz quem ela é e onde ver a documentação. */
  @Get()
  @ApiOperation({ summary: 'Informações da API' })
  @ApiOkResponse({ type: ApiInfo })
  getInfo(): ApiInfo {
    return {
      name: 'Pertim Shop API',
      slogan: "Tudo pertim d'ocê.",
      health: '/health',
      docs: '/docs',
    };
  }
}
