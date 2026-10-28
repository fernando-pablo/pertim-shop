import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { Merchant, Store } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthMerchant, JwtPayload } from './auth-merchant';
import { AuthResponseDto, MeDto } from './dto/auth.dto';

/**
 * Hash de uma senha qualquer, usado quando o e-mail não existe. Assim a
 * resposta demora o mesmo tempo nos dois casos, e ninguém descobre quais
 * e-mails estão cadastrados medindo o tempo.
 */
const DUMMY_HASH =
  '$2b$10$Tk9l259PMp1mIyAjU8P8N.ODvDNR.0vAP.cIJu2UsUC.XjLfYzlHK';

const INVALID_LOGIN = 'E-mail ou senha incorretos';

type MerchantWithStore = Merchant & { store: Store };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string): Promise<AuthResponseDto> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { email },
      include: { store: true },
    });

    const passwordOk = await compare(
      password,
      merchant?.passwordHash ?? DUMMY_HASH,
    );
    if (!merchant || !passwordOk || !merchant.store.isActive) {
      throw new UnauthorizedException(INVALID_LOGIN);
    }
    return this.issueToken(merchant);
  }

  /** Entrar com um clique: só funciona em lojas de demonstração. */
  async demoLogin(slug: string): Promise<AuthResponseDto> {
    const merchant = await this.prisma.merchant.findFirst({
      where: { store: { slug, isDemo: true, isActive: true } },
      include: { store: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!merchant) {
      throw new UnauthorizedException('Loja de demonstração não encontrada');
    }
    return this.issueToken(merchant);
  }

  async me(auth: AuthMerchant): Promise<MeDto> {
    const merchant = await this.prisma.merchant.findFirst({
      where: { id: auth.merchantId, storeId: auth.storeId },
      include: { store: true },
    });
    if (!merchant) {
      throw new UnauthorizedException('Faça login para continuar');
    }
    return toInfo(merchant);
  }

  private async issueToken(
    merchant: MerchantWithStore,
  ): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: merchant.id, storeId: merchant.storeId };
    const accessToken = await this.jwt.signAsync(payload);
    return Object.assign(toInfo(merchant), { accessToken });
  }
}

function toInfo(merchant: MerchantWithStore): MeDto {
  return {
    merchant: { id: merchant.id, name: merchant.name, email: merchant.email },
    store: {
      slug: merchant.store.slug,
      name: merchant.store.name,
      isDemo: merchant.store.isDemo,
    },
  };
}
