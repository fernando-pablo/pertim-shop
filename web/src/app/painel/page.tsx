import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AutoRefresh } from '@/components/panel/auto-refresh';
import {
  OrderCard,
  Pagination,
  StatusFilter,
} from '@/components/panel/order-parts';
import { PanelHeader } from '@/components/panel/panel-header';
import { PanelSkeleton } from '@/components/panel/panel-skeleton';
import { isOrderStatus, STATUS_LABELS } from '@/lib/order-status';
import { getOrders, getSession } from '@/lib/panel-api';

export const metadata: Metadata = { title: 'Pedidos' };

/** Lista de pedidos da loja, do mais novo ao mais antigo. */
export default function OrdersPage(props: PageProps<'/painel'>) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-6">
          <PanelSkeleton label="Carregando os pedidos" />
        </div>
      }
    >
      <OrdersContent {...props} />
    </Suspense>
  );
}

async function OrdersContent({ searchParams }: PageProps<'/painel'>) {
  const query = await searchParams;
  const status = isOrderStatus(query.status) ? query.status : undefined;
  const page = Math.max(1, Number.parseInt(String(query.pagina), 10) || 1);

  const [session, orders] = await Promise.all([
    getSession(),
    getOrders(status, page),
  ]);

  return (
    <>
      <PanelHeader session={session} current="pedidos" />
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold">Pedidos</h1>
          <AutoRefresh seconds={15} />
        </div>
        {query.restaurado === '1' && (
          <p className="rounded-xl bg-green-100 px-4 py-3 text-sm font-semibold text-green-900">
            Pronto: a loja voltou aos dados originais.
          </p>
        )}
        <StatusFilter current={status} />

        {orders.data.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {orders.data.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
            {status
              ? `Nenhum pedido "${STATUS_LABELS[status]}" por aqui.`
              : 'Nenhum pedido ainda. Quando um cliente pedir pela vitrine, ele aparece aqui.'}
          </div>
        )}

        <Pagination
          page={orders.page}
          pageSize={orders.pageSize}
          total={orders.total}
          status={status}
        />
        <p className="text-center text-xs text-muted">
          A lista se atualiza sozinha a cada 15 segundos.
        </p>
      </main>
    </>
  );
}
