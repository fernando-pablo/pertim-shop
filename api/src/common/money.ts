/** 7380 -> "R$ 73,80"; 123456 -> "R$ 1.234,56" */
export function formatBRL(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const value = Math.abs(cents);
  const reais = Math.floor(value / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centavos = (value % 100).toString().padStart(2, '0');
  return `${sign}R$ ${reais},${centavos}`;
}
