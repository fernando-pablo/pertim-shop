'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { formatBRL } from '@/lib/money';
import type { OrderCreated } from '@/lib/types';
import { ChatIcon, CheckIcon } from './icons';

/**
 * Pedido criado. Na loja de verdade, abre o WhatsApp com a mensagem pronta.
 * Na loja de demonstração, mostra a mensagem numa simulação (nada é enviado).
 */
export function OrderSent({
  store,
  result,
}: {
  store: { slug: string; name: string };
  result: OrderCreated;
}) {
  const { order, whatsapp, isDemo } = result;

  useEffect(() => {
    if (!isDemo) window.location.href = whatsapp.url;
  }, [isDemo, whatsapp.url]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-on-primary">
          <CheckIcon />
        </span>
        <div>
          <h1 className="font-heading text-3xl leading-tight font-semibold">
            Pedido #{order.number} criado!
          </h1>
          <p className="text-muted">Total: {formatBRL(order.totalCents)}</p>
        </div>
      </div>

      {isDemo ? (
        <section aria-labelledby="simulacao" className="flex flex-col gap-3">
          <p>
            Esta é uma <strong>loja de demonstração</strong>, então nada foi
            enviado. Numa loja de verdade, o WhatsApp abriria agora com esta
            mensagem pronta para a {store.name}:
          </p>
          <div className="rounded-store border border-line bg-surface">
            <p
              id="simulacao"
              className="flex items-center gap-2 border-b border-line px-4 py-3 font-bold"
            >
              <ChatIcon size={18} /> Simulação do WhatsApp
            </p>
            <div className="p-4">
              <p className="ml-auto w-fit max-w-[90%] rounded-store bg-soft p-3 text-sm leading-relaxed whitespace-pre-wrap">
                <WhatsAppText text={whatsapp.message} />
              </p>
            </div>
          </div>
          {/* Para quem visita o portfólio ver o outro lado: o painel. */}
          <Link
            href={`/painel/entrar?loja=${store.slug}&pedido=${order.id}`}
            className="flex h-12 items-center justify-center rounded-store bg-primary font-bold text-on-primary no-underline"
          >
            Ver este pedido no painel do lojista
          </Link>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <p>Abrindo o WhatsApp da loja com o seu pedido…</p>
          <a
            href={whatsapp.url}
            className="flex h-14 items-center justify-center rounded-store bg-primary font-bold text-on-primary no-underline"
          >
            Abrir o WhatsApp
          </a>
        </section>
      )}

      <Link
        href={`/${store.slug}`}
        className="flex h-12 items-center justify-center rounded-store border border-line font-semibold text-ink no-underline"
      >
        Voltar para a loja
      </Link>
    </div>
  );
}

/** No WhatsApp, *texto* aparece em negrito. A simulação faz o mesmo. */
function WhatsAppText({ text }: { text: string }) {
  return text
    .split(/(\*[^*\n]+\*)/g)
    .map((part, index) =>
      part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
        <strong key={index}>{part.slice(1, -1)}</strong>
      ) : (
        part
      ),
    );
}
