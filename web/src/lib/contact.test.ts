import { describe, expect, it } from 'vitest';
import { CONTACT_MESSAGE, contactUrl, PORTFOLIO_URL } from './contact';

describe('botão "Quero um sistema assim"', () => {
  const message = encodeURIComponent(CONTACT_MESSAGE);

  it('monta o link do WhatsApp com a mensagem pronta', () => {
    expect(contactUrl('5511912345678')).toBe(
      `https://wa.me/5511912345678?text=${message}`,
    );
  });

  it('aceita o número com pontuação e sem o 55 do Brasil', () => {
    expect(contactUrl('(11) 91234-5678')).toBe(
      `https://wa.me/5511912345678?text=${message}`,
    );
  });

  it('sem número (ou número estranho), leva para o portfólio', () => {
    expect(contactUrl(undefined)).toBe(PORTFOLIO_URL);
    expect(contactUrl('')).toBe(PORTFOLIO_URL);
    expect(contactUrl('123')).toBe(PORTFOLIO_URL);
  });
});
