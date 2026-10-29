'use client';

import { resetDemo } from '@/app/painel/actions';
import { ConfirmButton } from './feedback';

/**
 * Faixa no topo de todas as abas do painel, só nas lojas de demonstração:
 * o "Como testar" e o botão de restaurar, à vista de quem visita.
 */
export function DemoBar() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-950">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            Demonstração: pode mexer à vontade.
          </p>
          <ConfirmButton
            label="Restaurar dados da demonstração"
            question="Restaurar a loja? Os pedidos são apagados, e os produtos e as categorias voltam ao original."
            confirmLabel="Sim, restaurar"
            onConfirm={() => resetDemo()}
            triggerClassName="h-10 rounded-xl border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-950"
          />
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold underline">
            Como testar a demonstração
          </summary>
          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5">
            <li>
              Clique em <strong>Ver a loja</strong> e faça um pedido, com um
              nome e um telefone de teste.
            </li>
            <li>
              Volte para <strong>Pedidos</strong>: o pedido aparece em até 15
              segundos.
            </li>
            <li>
              Abra o pedido e mude a situação: confirmar, preparar e concluir.
            </li>
            <li>
              Em <strong>Produtos</strong>, pause um produto ou mude um preço e
              veja a loja mudar na hora.
            </li>
          </ol>
          <p className="mt-2">
            A loja volta ao original sozinha uma vez por dia. Para voltar agora,
            use o botão de restaurar.
          </p>
        </details>
      </div>
    </div>
  );
}
