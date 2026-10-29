import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RateLimit } from '../rate-limit/rate-limit.decorator';
import type { AuthMerchant } from './auth-merchant';
import { AuthService } from './auth.service';
import { CurrentMerchant } from './current-merchant.decorator';
import { AuthResponseDto, DemoLoginDto, LoginDto, MeDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Login do lojista')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  // Contra quem tenta adivinhar senhas: 10 tentativas a cada 15 minutos.
  @RateLimit({ name: 'login', limit: 10, windowSeconds: 15 * 60 })
  @ApiOperation({ summary: 'Entrar no painel com e-mail e senha' })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'E-mail ou senha incorretos' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('demo-login')
  @HttpCode(200)
  @RateLimit({ name: 'demo-login', limit: 30, windowSeconds: 15 * 60 })
  @ApiOperation({
    summary: 'Entrar com um clique numa loja de demonstração',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  demoLogin(@Body() dto: DemoLoginDto): Promise<AuthResponseDto> {
    return this.auth.demoLogin(dto.slug);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quem está logado' })
  @ApiOkResponse({ type: MeDto })
  me(@CurrentMerchant() auth: AuthMerchant): Promise<MeDto> {
    return this.auth.me(auth);
  }
}
