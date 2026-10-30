import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ProductSummaryDto } from './product.dto';

/** Busca da vitrine: ?q=racao gato */
export class SearchQuery {
  /** O que o cliente digitou. Ex.: "racao gato" */
  @IsString({ message: 'q deve ser um texto' })
  @MinLength(1, { message: 'Digite o que você procura' })
  @MaxLength(60, { message: 'A busca pode ter no máximo 60 caracteres' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  q: string;
}

export class SearchResultDto {
  /**
   * exact: os produtos têm as palavras buscadas.
   * similar: nada tinha as palavras; estes são nomes parecidos (erro de digitação).
   * none: nada encontrado.
   */
  @ApiProperty({ enum: ['exact', 'similar', 'none'] })
  match: 'exact' | 'similar' | 'none';
  products: ProductSummaryDto[];
}
