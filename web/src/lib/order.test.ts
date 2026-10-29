import { describe, expect, it } from 'vitest';
import type { CartItem } from './cart';
import { formatBRL, formatPriceRange } from './money';
import {
  apiErrorMessage,
  buildOrderPayload,
  type CheckoutForm,
  maskPhone,
  validateCheckout,
} from './order';
import { initials, readableOn, safeColor, themeStyle } from './theme';

const item: CartItem = {
  key: 'k',
  productId: 'p1',
  variantId: 'v1',
  addonIds: [],
  notes: '',
  quantity: 2,
  productName: 'Vestido',
  variantName: 'M / Areia',
  addonNames: [],
  unitPriceCents: 18990,
};

const form: CheckoutForm = {
  customerName: '  Maria ',
  customerPhone: '(38) 99999-0000',
  fulfillment: 'PICKUP',
  address: 'Rua A, 10',
  notes: '',
};

describe('pedido', () => {
  it('manda só as escolhas, nunca o preço', () => {
    const payload = buildOrderPayload([item], form);

    expect(payload).toEqual({
      customerName: 'Maria',
      customerPhone: '38999990000',
      fulfillment: 'PICKUP',
      items: [{ productId: 'p1', variantId: 'v1', quantity: 2 }],
    });
  });

  it('o endereço só vai na entrega', () => {
    const payload = buildOrderPayload([item], {
      ...form,
      fulfillment: 'DELIVERY',
    });
    expect(payload.address).toBe('Rua A, 10');
  });

  it('confere nome, telefone e endereço', () => {
    expect(validateCheckout(form)).toBeNull();
    expect(validateCheckout({ ...form, customerName: 'M' })).toBe(
      'Informe o seu nome',
    );
    expect(validateCheckout({ ...form, customerPhone: '9999' })).toBe(
      'Informe o telefone com DDD',
    );
    expect(
      validateCheckout({ ...form, fulfillment: 'DELIVERY', address: '' }),
    ).toBe('Informe o endereço de entrega');
  });

  it('formata o telefone enquanto o cliente digita', () => {
    expect(maskPhone('3')).toBe('(3');
    expect(maskPhone('38999')).toBe('(38) 999');
    expect(maskPhone('3832211234')).toBe('(38) 3221-1234');
    expect(maskPhone('38999990000')).toBe('(38) 99999-0000');
  });

  it('usa a mensagem que a API mandou', () => {
    expect(apiErrorMessage(409, { message: 'Estoque insuficiente: X' })).toBe(
      'Estoque insuficiente: X',
    );
    expect(apiErrorMessage(400, { message: ['Telefone inválido'] })).toBe(
      'Telefone inválido',
    );
    expect(apiErrorMessage(500, null)).toBe(
      'Não foi possível enviar o pedido. Tente de novo.',
    );
  });
});

describe('preço e tema', () => {
  it('formata em reais', () => {
    expect(formatBRL(1990).replace(/\s/g, ' ')).toBe('R$ 19,90');
    expect(formatPriceRange(1990, 3290).replace(/\s/g, ' ')).toBe(
      'a partir de R$ 19,90',
    );
  });

  it('só aceita cores válidas no tema', () => {
    expect(safeColor('#FAF7F2', '#000')).toBe('#FAF7F2');
    expect(safeColor('red; background: url(x)', '#000')).toBe('#000');
  });

  it('transforma o tema em variáveis CSS', () => {
    const style = themeStyle({
      mode: 'dark',
      colors: {
        background: '#14100D',
        surface: '#1F1915',
        text: '#F6EEE6',
        muted: '#B3A69A',
        primary: '#F28C28',
        primaryText: '#1A0F05',
        accent: '#FFC15E',
      },
      fonts: { heading: 'Bebas Neue', body: 'Fonte Desconhecida' },
      radius: 99,
    }) as Record<string, string>;

    expect(style['--store-primary']).toBe('#F28C28');
    expect(style['--store-accent-text']).toBe('#FFC15E');
    expect(style['--store-radius']).toBe('32px');
    expect(style['--store-font-heading']).toContain('Bebas Neue');
    expect(style['--store-font-body']).toContain('Manrope');
    expect(style.colorScheme).toBe('dark');
  });

  it('escolhe texto escuro ou claro conforme o fundo', () => {
    expect(readableOn('#FFC15E')).toBe('#1A1A1A');
    expect(readableOn('#2F5BD3')).toBe('#FFFFFF');
    expect(readableOn('#fff')).toBe('#1A1A1A');
  });

  it('monta as iniciais do logo', () => {
    expect(initials('Moda Chic')).toBe('MC');
    expect(initials('Fome-Sô')).toBe('FS');
    expect(initials('Bicho Bão Pet Shop')).toBe('BB');
  });
});
