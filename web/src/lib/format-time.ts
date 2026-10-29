/**
 * Horário dos pedidos. O servidor pode estar em outro fuso (no Docker é
 * UTC), então o fuso de Brasília é fixado aqui.
 */
const TIME_ZONE = 'America/Sao_Paulo';

const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const hourFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
});

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** "2026-10-29": o dia no fuso de Brasília. */
const dayKey = (date: Date) => dayFormat.format(date);

/**
 * Quando o pedido chegou: "Agora", "Há 5 min", "Hoje, 14:32",
 * "Ontem, 09:10" ou "28/10, 18:05".
 */
export function formatOrderTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const diff = now.getTime() - date.getTime();
  if (diff >= 0 && diff < MINUTE) return 'Agora';
  if (diff >= 0 && diff < 60 * MINUTE) {
    return `Há ${Math.floor(diff / MINUTE)} min`;
  }

  const hour = hourFormat.format(date);
  if (dayKey(date) === dayKey(now)) return `Hoje, ${hour}`;
  if (dayKey(date) === dayKey(new Date(now.getTime() - DAY))) {
    return `Ontem, ${hour}`;
  }
  return `${dateFormat.format(date)}, ${hour}`;
}
