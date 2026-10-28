import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Preços em centavos, de R$ 0,00 a R$ 100.000,00 */
const MAX_PRICE = 10_000_000;

export class VariantInputDto {
  /** Ex.: "M / Azul", "15 kg" */
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  /** Ex.: { "tamanho": "M", "cor": "Azul" } */
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;

  /** Vazio (null) = usa o preço do produto */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE)
  priceCents?: number | null;

  /** Vazio (null) = não controla estoque */
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'O estoque não pode ser negativo' })
  @Max(100_000)
  stock?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVariantDto extends PartialType(VariantInputDto) {}

export class AddonInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @IsInt()
  @Min(0)
  @Max(MAX_PRICE)
  priceCents: number;
}

export class AddonGroupInputDto {
  /** Ex.: "Adicionais", "Ponto da carne" */
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  /** Mínimo de escolhas (1 ou mais = obrigatório) */
  @IsInt()
  @Min(0)
  minSelect: number;

  /** Máximo de escolhas (1 = escolha única) */
  @IsInt()
  @Min(1)
  maxSelect: number;

  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => AddonInputDto)
  addons: AddonInputDto[];
}

export class ReplaceAddonGroupsDto {
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AddonGroupInputDto)
  groups: AddonGroupInputDto[];
}

export class CreateProductDto {
  @IsString()
  @MinLength(2, { message: 'O nome precisa de 2 letras ou mais' })
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  /** Preço em centavos: R$ 19,90 = 1990 */
  @IsInt({ message: 'O preço deve estar em centavos (número inteiro)' })
  @Min(0)
  @Max(MAX_PRICE)
  priceCents: number;

  /** Vazio (null) = sem categoria */
  @IsOptional()
  @IsUUID('all', { message: 'categoryId deve ser o id de uma categoria' })
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => VariantInputDto)
  variants?: VariantInputDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AddonGroupInputDto)
  addonGroups?: AddonGroupInputDto[];
}

/** Atualiza só os dados do produto; variações e adicionais têm rotas próprias. */
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['variants', 'addonGroups'] as const),
) {}
