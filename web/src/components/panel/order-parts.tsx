import Link from 'next/link';
import { formatOrderTime } from '@/lib/format-time';
import { formatBRL } from '@/lib/money';
import {
  STATUS_FILTERS,
  STATUS_LABELS,
  STATUS_STYLES,
} from '@/lib/order-status';
import type { OrderStatus, PanelOrder } from '@/lib/types';

/** Etiqueta colorida com a situação do pedido. */
export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Filtros por situação. Cada um é um link (?status=...). */
export function StatusFilter({ current }: { current?: OrderStatus }) {
  const filters: { href: string; label: string; active: boolean }[] = [
    { href: '/painel', label: 'Todos', active: !current },
    ...STATUS_FILTERS.map((status) => ({
      href: `/painel?status=${status}`,
      label: STATUS_LABELS[status],
      active: current === status,
    })),
  ];
  return (
    <nav
      aria-label="Filtrar por situação"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
    >
      {filters.map((filter) => (
        <Link
          key={filter.href}
          href={filter.href}
          aria-current={filter.active ? 'page' : undefined}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold no-underline ${
            filter.active
              ? 'border-ink bg-ink text-bg'
              : 'border-line bg-surface text-ink'
          }`}
        >
          {filter.label}
        </Link>
      ))}
    </nav>
  );
}

const itemCount = (order: PanelOrder) =>
  order.items.reduce((sum, item) => sum + item.quantity, 0);

/** Cartão do pedido na lista. */
export function OrderCard({ order }: { order: PanelOrder }) {
  const count = itemCount(order);
  return (
    <Link
      href={`/painel/pedidos/${order.id}`}
      className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4 text-ink no-underline"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-lg font-bold">#{order.number}</span>
        <StatusBadge status={order.status} />
      </span>
      <span className="flex items-baseline justify-between gap-3">
        <span className="truncate font-semibold">{order.customerName}</span>
        <span className="shrink-0 text-sm text-muted">
          {formatOrderTime(order.createdAt)}
        </span>
      </span>
      <span className="flex items-baseline justify-between gap-3 text-sm text-muted">
        <span>
          {count} {count === 1 ? 'item' : 'itens'} ·{' '}
          {order.fulfillment === 'DELIVERY' ? 'Entrega' : 'Retirada'}
        </span>
        <span className="font-bold text-ink">
          {formatBRL(order.totalCents)}
        </span>
      </span>
    </Link>
  );
}

/** Páginas da lista: "Anteriores" e "Mais antigos". */
export function Pagination({
  page,
  pageSize,
  total,
  status,
}: {
  page: number;
  pageSize: number;
  total: number;
  status?: OrderStatus;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages === 1) return null;
  const href = (target: number) => {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (target > 1) query.set('pagina', String(target));
    const text = query.toString();
    return text ? `/painel?${text}` : '/painel';
  };
  const linkClass =
    'rounded-xl border border-line bg-surface px-4 py-2 font-semibold text-ink no-underline';
  return (
    <nav
      aria-label="Páginas"
      className="flex items-center justify-between gap-3 text-sm"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkClass}>
          Mais novos
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted">
        Página {page} de {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className={linkClass}>
          Mais antigos
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
