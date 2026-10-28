/** Deixa só os números: "(38) 99999-0000" -> "38999990000" */
export function onlyDigits(value: unknown): unknown {
  return typeof value === 'string' ? value.replace(/\D/g, '') : value;
}

/** "38999990000" -> "(38) 99999-0000". Outros formatos ficam como vieram. */
export function formatPhone(digits: string): string {
  const match = /^(\d{2})(\d{4,5})(\d{4})$/.exec(digits);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : digits;
}
