import { formatBRL } from './money';
import { formatPhone, onlyDigits } from './phone';

describe('formatBRL', () => {
  it.each([
    [0, 'R$ 0,00'],
    [5, 'R$ 0,05'],
    [7380, 'R$ 73,80'],
    [123456, 'R$ 1.234,56'],
    [10000000, 'R$ 100.000,00'],
  ])('%i centavos = %s', (cents, text) => {
    expect(formatBRL(cents)).toBe(text);
  });
});

describe('telefone', () => {
  it('guarda só os números', () => {
    expect(onlyDigits('(38) 99999-0000')).toBe('38999990000');
  });

  it('mostra com máscara quando reconhece o formato', () => {
    expect(formatPhone('38999990000')).toBe('(38) 99999-0000');
    expect(formatPhone('3832210000')).toBe('(38) 3221-0000');
    expect(formatPhone('5538999990000')).toBe('5538999990000');
  });
});
