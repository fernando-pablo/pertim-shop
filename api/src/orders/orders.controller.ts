import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RateLimit } from '../rate-limit/rate-limit.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderCreatedDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Pedidos')
@Controller('stores/:slug/orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @HttpCode(201)
  // Contra robôs: 20 pedidos por IP a cada 10 minutos, em cada loja.
  @RateLimit({ name: 'orders', limit: 20, windowSeconds: 10 * 60 })
  @ApiOperation({
    summary: 'Cria um pedido e devolve a mensagem pronta para o WhatsApp',
  })
  @ApiCreatedResponse({ type: OrderCreatedDto })
  @ApiBadRequestResponse({ description: 'Dados ou escolhas inválidas' })
  @ApiConflictResponse({ description: 'Estoque insuficiente' })
  @ApiNotFoundResponse({ description: 'Loja não encontrada' })
  create(
    @Param('slug') slug: string,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderCreatedDto> {
    return this.orders.create(slug, dto);
  }
}
