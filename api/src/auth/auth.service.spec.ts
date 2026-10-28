import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prisma = { merchant: { findUnique: jest.fn(), findFirst: jest.fn() } };
  const jwt = { signAsync: jest.fn() };
  let service: AuthService;
  let merchant: Record<string, unknown>;

  beforeAll(async () => {
    merchant = {
      id: 'lojista-1',
      storeId: 'loja-1',
      name: 'Lojista',
      email: 'lojista@loja.example',
      passwordHash: await hash('senha-certa', 4),
      store: { slug: 'loja', name: 'Loja', isDemo: true, isActive: true },
    };
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    jwt.signAsync.mockResolvedValue('token-assinado');
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('entrega o token quando e-mail e senha estão certos', async () => {
    prisma.merchant.findUnique.mockResolvedValue(merchant);

    const result = await service.login('lojista@loja.example', 'senha-certa');

    expect(result.accessToken).toBe('token-assinado');
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: 'lojista-1',
      storeId: 'loja-1',
    });
    expect(result).not.toHaveProperty('merchant.passwordHash');
  });

  it('recusa senha errada', async () => {
    prisma.merchant.findUnique.mockResolvedValue(merchant);
    await expect(
      service.login('lojista@loja.example', 'senha-errada'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('recusa e-mail que não existe com a mesma mensagem', async () => {
    prisma.merchant.findUnique.mockResolvedValue(null);
    await expect(service.login('ninguem@loja.example', 'x')).rejects.toThrow(
      'E-mail ou senha incorretos',
    );
  });

  it('login de demonstração só procura lojas de demonstração', async () => {
    prisma.merchant.findFirst.mockResolvedValue(null);

    await expect(service.demoLogin('loja-de-verdade')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.merchant.findFirst.mock.calls[0][0].where).toEqual({
      store: { slug: 'loja-de-verdade', isDemo: true, isActive: true },
    });
  });
});
