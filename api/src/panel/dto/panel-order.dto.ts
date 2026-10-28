import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/enums';
import { OrderDto } from '../../orders/dto/order.dto';

const STATUSES = Object.values(OrderStatus);

export class ListOrdersQuery {
  /** Mostrar só os pedidos com este status */
  @IsOptional()
  @IsIn(STATUSES, { message: `status deve ser um de: ${STATUSES.join(', ')}` })
  @ApiProperty({ enum: STATUSES, required: false })
  status?: OrderStatus;

  /** Página (começa em 1) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /** Pedidos por página (até 50) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

export class PaginatedOrdersDto {
  data: OrderDto[];
  page: number;
  pageSize: number;
  total: number;
}

export class UpdateOrderStatusDto {
  @IsIn(STATUSES, { message: `status deve ser um de: ${STATUSES.join(', ')}` })
  @ApiProperty({ enum: STATUSES })
  status: OrderStatus;
}
