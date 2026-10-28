import { OrderDto } from './dto/order.dto';
import { buildOrderMessage, buildWhatsApp } from './whatsapp-message';

const order: OrderDto = {
  id: 'pedido-1',
  number: 12,
  status: 'NEW',
  customerName: 'Maria',
  customerPhone: '38999990000',
  fulfillment: 'DELIVERY',
  address: 'Rua das Flores, 123',
  notes: 'Troco para R$ 100',
  subtotalCents: 8070,
  totalCents: 8070,
  createdAt: new Date(),
  items: [
    {
      productName: 'Burger Trem Bão',
      variantName: null,
      quantity: 2,
      unitPriceCents: 3690,
      totalCents: 7380,
      addons: [
        { name: 'Ao ponto', priceCents: 0 },
        { name: 'Bacon', priceCents: 400 },
      ],
      notes: 'sem cebola',
    },
    {
      productName: 'Refrigerante Lata',
      variantName: 'Cola',
      quantity: 1,
      unitPriceCents: 690,
      totalCents: 690,
      addons: [],
      notes: null,
    },
  ],
};

describe('mensagem do WhatsApp', () => {
  it('monta o pedido completo e legível', () => {
    expect(buildOrderMessage('Fome-Sô', order)).toBe(
      [
        '*Pedido #12 - Fome-Sô*',
        '',
        '2x Burger Trem Bão',
        '   Ao ponto, Bacon',
        '   Obs.: sem cebola',
        '   R$ 73,80',
        '1x Refrigerante Lata - Cola',
        '   R$ 6,90',
        '',
        '*Total: R$ 80,70*',
        '',
        '*Cliente:* Maria',
        '*Telefone:* (38) 99999-0000',
        '*Entrega:* Rua das Flores, 123',
        '*Observações:* Troco para R$ 100',
        '',
        'Pedido feito pelo Pertim Shop',
      ].join('\n'),
    );
  });

  it('avisa quando é retirada na loja', () => {
    const pickup: OrderDto = Object.assign({}, order, {
      fulfillment: 'PICKUP' as const,
      address: null,
    });
    const message = buildOrderMessage('Fome-Sô', pickup);
    expect(message).toContain('*Retirada na loja*');
    expect(message).not.toContain('Entrega:');
  });

  it('gera o link do WhatsApp com o texto codificado', () => {
    const whatsapp = buildWhatsApp('5538999990000', 'Fome-Sô', order);
    expect(whatsapp.url.startsWith('https://wa.me/5538999990000?text=')).toBe(
      true,
    );
    expect(decodeURIComponent(whatsapp.url.split('text=')[1])).toBe(
      whatsapp.message,
    );
  });
});
