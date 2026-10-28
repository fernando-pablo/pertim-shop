import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString()
  @MinLength(1, { message: 'Informe a senha' })
  @MaxLength(100)
  password: string;
}

/** Entrar com um clique numa loja de demonstração. */
export class DemoLoginDto {
  /** Endereço da loja de demonstração. Ex.: fome-so */
  @IsString()
  @MaxLength(60)
  slug: string;
}

export class AuthMerchantInfoDto {
  id: string;
  name: string;
  email: string;
}

export class AuthStoreInfoDto {
  slug: string;
  name: string;
  isDemo: boolean;
}

export class AuthResponseDto {
  /** Token JWT. Envie no cabeçalho: Authorization: Bearer <token> */
  accessToken: string;
  merchant: AuthMerchantInfoDto;
  store: AuthStoreInfoDto;
}

export class MeDto {
  merchant: AuthMerchantInfoDto;
  store: AuthStoreInfoDto;
}
