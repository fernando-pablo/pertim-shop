/** Até quantas palavras a busca considera. */
const MAX_WORDS = 5;

/**
 * Prepara o texto da busca: tira acentos, passa para minúsculas e separa
 * as palavras. "  Ração   GATO! " vira ["racao", "gato"].
 * Só sobram letras e números, então nada do que a pessoa digita vira
 * comando no banco (e os valores ainda vão como parâmetros na consulta).
 */
export function searchWords(text: string): string[] {
  const words = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return [...new Set(words)].slice(0, MAX_WORDS);
}
