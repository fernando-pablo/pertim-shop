/**
 * Busca da lista de produtos do painel (feita na tela). Mesma ideia da
 * busca da vitrine: sem acento, sem diferença de maiúscula, e cada palavra
 * pode estar em qualquer lugar do texto.
 */

/** "  Ração   GATO " -> ["racao", "gato"] */
export function searchWords(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Todas as palavras da busca aparecem no texto? */
export function matchesSearch(text: string, search: string): boolean {
  const words = searchWords(search);
  const plain = searchWords(text).join(' ');
  return words.every((word) => plain.includes(word));
}
