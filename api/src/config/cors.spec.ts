import { corsOrigins } from './cors';

describe('corsOrigins', () => {
  it('sem valor, libera qualquer endereço (rodando no PC)', () => {
    expect(corsOrigins(undefined)).toBe(true);
    expect(corsOrigins('')).toBe(true);
    expect(corsOrigins(' , ')).toBe(true);
  });

  it('lê um ou mais endereços separados por vírgula', () => {
    expect(corsOrigins('https://pertim-shop.vercel.app')).toEqual([
      'https://pertim-shop.vercel.app',
    ]);
    expect(corsOrigins('https://a.com, https://b.com')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });

  it('tira a barra do fim, que o navegador nunca envia', () => {
    expect(corsOrigins('https://pertim-shop.vercel.app/')).toEqual([
      'https://pertim-shop.vercel.app',
    ]);
  });
});
