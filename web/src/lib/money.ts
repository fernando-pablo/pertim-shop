const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** 1990 -> "R$ 19,90" */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

/** Preço da lista: "R$ 19,90" ou "a partir de R$ 19,90". */
export function formatPriceRange(minCents: number, maxCents: number): string {
  const price = formatBRL(minCents);
  return maxCents > minCents ? `a partir de ${price}` : price;
}
