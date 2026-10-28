import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Filtros da lista de produtos: ?category=...&search=... */
export class ListProductsQuery {
  /** Mostrar só os produtos desta categoria (id) */
  @IsOptional()
  @IsUUID('all', { message: 'category deve ser o id de uma categoria' })
  category?: string;

  /** Busca pelo nome ou pela descrição. Ex.: "vestido" */
  @IsOptional()
  @IsString({ message: 'search deve ser um texto' })
  @MaxLength(60, { message: 'search pode ter no máximo 60 caracteres' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;
}
