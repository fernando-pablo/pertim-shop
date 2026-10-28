import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { onlyDigits } from '../../common/phone';
import { Fulfillment } from '../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Um item do carrinho. Repare que não existe campo de preço:
 * o servidor calcula tudo a partir do banco e nunca confia no navegador.
 */
export class CreateOrderItemDto {
  @IsUUID('all', { message: 'productId deve ser o id de um produto' })
  productId: string;

  /** Obrigatório quando o produto tem mais de uma variação */
  @IsOptional()
  @IsUUID('all', { message: 'variantId deve ser o id de uma variação' })
  variantId?: string;

  @IsInt({ message: 'quantity deve ser um número inteiro' })
  @Min(1, { message: 'A quantidade mínima é 1' })
  @Max(50, { message: 'A quantidade máxima por item é 50' })
  quantity: number;

  /** Adicionais escolhidos (ids) */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true, message: 'addonIds deve ter ids de adicionais' })
  addonIds?: string[];

  /** Ex.: "sem cebola" */
  @IsOptional()
  @IsString()
  @MaxLength(140, { message: 'A observação do item tem no máximo 140 letras' })
  @Transform(trim)
  notes?: string;
}

// Os validadores rodam de baixo para cima: o mais básico fica mais perto do campo.
export class CreateOrderDto {
  @Transform(trim)
  @MaxLength(80, { message: 'O nome tem no máximo 80 letras' })
  @MinLength(2, { message: 'Informe o nome do cliente' })
  @IsString({ message: 'Informe o nome do cliente' })
  customerName: string;

  /** Aceita com ou sem máscara; a API guarda só os números */
  @Transform(({ value }: { value: unknown }) => onlyDigits(value))
  @Matches(/^\d{10,13}$/, { message: 'Telefone inválido: use DDD + número' })
  customerPhone: string;

  @IsIn(Object.values(Fulfillment), {
    message: 'fulfillment deve ser PICKUP (retirada) ou DELIVERY (entrega)',
  })
  fulfillment: Fulfillment;

  /** Obrigatório na entrega */
  @ValidateIf((order: CreateOrderDto) => order.fulfillment === 'DELIVERY')
  @Transform(trim)
  @MaxLength(200, { message: 'O endereço tem no máximo 200 letras' })
  @MinLength(5, { message: 'Informe o endereço de entrega' })
  @IsString({ message: 'Informe o endereço de entrega' })
  address?: string;

  /** Ex.: "troco para R$ 100" */
  @IsOptional()
  @Transform(trim)
  @MaxLength(300, { message: 'As observações têm no máximo 300 letras' })
  @IsString()
  notes?: string;

  @Type(() => CreateOrderItemDto)
  @ValidateNested({ each: true })
  @ArrayMaxSize(30, { message: 'Máximo de 30 itens por pedido' })
  @ArrayMinSize(1, { message: 'O carrinho está vazio' })
  @IsArray({ message: 'Envie os itens do carrinho' })
  items: CreateOrderItemDto[];
}
