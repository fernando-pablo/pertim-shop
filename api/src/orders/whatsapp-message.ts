import { formatBRL } from '../common/money';
import { formatPhone } from '../common/phone';
import { OrderDto, WhatsAppDto } from './dto/order.dto';

/**
 * Monta a mensagem do pedido para o WhatsApp da loja.
 * Os asteriscos deixam o texto em negrito no WhatsApp.
 */
export function buildOrderMessage(storeName: string, order: OrderDto): string {
  const lines: string[] = [`*Pedido #${order.number} - ${storeName}*`, ''];

  for (const item of order.items) {
    const variant = item.variantName ? ` - ${item.variantName}` : '';
    lines.push(`${item.quantity}x ${item.productName}${variant}`);
    if (item.addons.length > 0) {
      lines.push(`   ${item.addons.map((addon) => addon.name).join(', ')}`);
    }
    if (item.notes) {
      lines.push(`   Obs.: ${item.notes}`);
    }
    lines.push(`   ${formatBRL(item.totalCents)}`);
  }

  lines.push('', `*Total: ${formatBRL(order.totalCents)}*`, '');
  lines.push(`*Cliente:* ${order.customerName}`);
  lines.push(`*Telefone:* ${formatPhone(order.customerPhone)}`);
  lines.push(
    order.fulfillment === 'DELIVERY'
      ? `*Entrega:* ${order.address}`
      : '*Retirada na loja*',
  );
  if (order.notes) {
    lines.push(`*Observações:* ${order.notes}`);
  }
  lines.push('', 'Pedido feito pelo Pertim Shop');

  return lines.join('\n');
}

export function buildWhatsApp(
  storePhone: string,
  storeName: string,
  order: OrderDto,
): WhatsAppDto {
  const message = buildOrderMessage(storeName, order);
  return {
    phone: storePhone,
    message,
    url: `https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`,
  };
}
