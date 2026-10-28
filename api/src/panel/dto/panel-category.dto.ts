import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class PanelCategoryDto {
  id: string;
  name: string;
  position: number;
  /** Quantos produtos (ativos ou não) estão na categoria */
  productCount: number;
}

export class CreateCategoryDto {
  @IsString()
  @MinLength(2, { message: 'O nome da categoria precisa de 2 letras ou mais' })
  @MaxLength(40)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name: string;

  /** Ordem na vitrine (0 aparece primeiro) */
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
