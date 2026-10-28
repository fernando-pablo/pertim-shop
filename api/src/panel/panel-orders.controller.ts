import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthMerchant } from '../auth/auth-merchant';
import { CurrentMerchant } from '../auth/current-merchant.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrderDto } from '../orders/dto/order.dto';
import {
  ListOrdersQuery,
  PaginatedOrdersDto,
  UpdateOrderStatusDto,
} from './dto/panel-order.dto';
import { PanelOrdersService } from './panel-orders.service';

@ApiTags('Painel: pedidos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('panel/orders')
export class PanelOrdersController {
  constructor(private readonly orders: PanelOrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Pedidos da minha loja, do mais novo ao mais antigo',
  })
  @ApiOkResponse({ type: PaginatedOrdersDto })
  list(
    @CurrentMerchant() auth: AuthMerchant,
    @Query() query: ListOrdersQuery,
  ): Promise<PaginatedOrdersDto> {
    return this.orders.list(auth.storeId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Um pedido da minha loja' })
  @ApiOkResponse({ type: OrderDto })
  get(
    @CurrentMerchant() auth: AuthMerchant,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderDto> {
    return this.orders.get(auth.storeId, id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Muda o status do pedido (cancelar devolve o estoque)',
  })
  @ApiOkResponse({ type: OrderDto })
  updateStatus(
    @CurrentMerchant() auth: AuthMerchant,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderDto> {
    return this.orders.updateStatus(auth.storeId, id, dto.status);
  }
}
