import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BackIcon, ChatIcon } from '@/components/icons';
import { OrderActions } from '@/components/panel/order-actions';
import { StatusBadge } from '@/components/panel/order-parts';
import { PanelHeader } from '@/components/panel/panel-header';
import { PanelSkeleton } from '@/components/panel/panel-skeleton';
import { formatOrderTime } from '@/lib/format-time';
import { formatBRL } from '@/lib/money';
import { maskPhone } from '@/lib/order';
import { getOrder, getSession } from '@/lib/panel-api';
import type { PanelOrder } from '@/lib/types';

export const metadata: Metadata = { title: 'Pedido' };

/** Um pedido: itens, cliente, entrega e os botões de situação. */
export default function OrderPage(props: PageProps<'/painel/pedidos/[id]'>) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-6">
          <PanelSkeleton label="Carregando o pedido" />
        </div>
      }
    >
      <OrderContent {...props} />
    </Suspense>
  );
}

async function OrderContent({ params }: PageProps<'/painel/pedidos/[id]'>) {
  const { id } = await params;
  const [session, order] = await Promise.all([getSession(), getOrder(id)]);
  if (!order) notFound();

  return (
    <>
      <PanelHeader session={session} />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <div className="flex flex-col gap-2">
          <Link
            href="/painel"
            className="flex w-fit items-center gap-1 text-sm font-semibold text-ink no-underline"
          >
            <BackIcon size={18} /> Pedidos
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold">Pedido #{order.number}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted">
            {formatOrderTime(order.createdAt)}
          </p>
        </div>
        {/* No celular, os botões vêm primeiro; no computador, ficam do lado. */}
        <div className="grid gap-5 sm:grid-cols-[1fr_16rem] sm:items-start">
          <aside className="flex flex-col gap-3 sm:sticky sm:top-4 sm:col-start-2 sm:row-start-1">
            <h2 className="text-sm font-bold tracking-widest text-muted uppercase">
              Situação
            </h2>
            <OrderActions
              orderId={order.id}
              status={order.status}
              fulfillment={order.fulfillment}
            />
            {(order.status === 'COMPLETED' || order.status === 'CANCELED') && (
              <p className="text-sm text-muted">
                Este pedido já foi encerrado.
              </p>
            )}
          </aside>
          <div className="flex flex-col gap-5 sm:col-start-1 sm:row-start-1">
            <Items order={order} />
            <Customer order={order} />
          </div>
        </div>
      </main>
    </>
  );
}

function Items({ order }: { order: PanelOrder }) {
  return (
    <section
      aria-labelledby="itens"
      className="rounded-xl border border-line bg-surface p-4"
    >
      <h2 id="itens" className="mb-3 text-lg font-bold">
        Itens
      </h2>
      <ul className="flex flex-col divide-y divide-line">
        {order.items.map((item, index) => (
          <li key={index} className="flex justify-between gap-3 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">
                {item.quantity}× {item.productName}
              </span>
              {item.variantName && (
                <span className="text-sm text-muted">{item.variantName}</span>
              )}
              {item.addons.map((addon) => (
                <span key={addon.name} className="text-sm text-muted">
                  + {addon.name}
                </span>
              ))}
              {item.notes && (
                <span className="text-sm text-ink">Obs.: {item.notes}</span>
              )}
            </div>
            <span className="shrink-0 font-semibold">
              {formatBRL(item.totalCents)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex justify-between border-t border-line pt-3 text-lg font-extrabold">
        <span>Total</span>
        <span>{formatBRL(order.totalCents)}</span>
      </p>
    </section>
  );
}

function Customer({ order }: { order: PanelOrder }) {
  const delivery = order.fulfillment === 'DELIVERY';
  return (
    <section
      aria-labelledby="cliente"
      className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4"
    >
      <h2 id="cliente" className="text-lg font-bold">
        Cliente
      </h2>
      <p className="font-semibold">{order.customerName}</p>
      <a
        href={`https://wa.me/55${order.customerPhone}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-fit items-center gap-2 font-semibold text-ink underline"
      >
        <ChatIcon size={18} /> {maskPhone(order.customerPhone)}
      </a>
      <p className="mt-2 font-semibold">
        {delivery ? 'Entrega' : 'Retirada na loja'}
      </p>
      {delivery && order.address && <p>{order.address}</p>}
      {order.notes && (
        <p className="mt-2 rounded-xl bg-soft p-3 text-sm">
          <strong>Observação:</strong> {order.notes}
        </p>
      )}
    </section>
  );
}
