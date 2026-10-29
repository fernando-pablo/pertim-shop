'use client';

import { resetDemo } from '@/app/painel/produtos/actions';
import { ConfirmButton } from './feedback';

/** Caixa "Restaurar dados da demonstração" (só nas lojas de demonstração). */
export function ResetDemo({ storeName }: { storeName: string }) {
  return (
    <section
      aria-labelledby="restaurar"
      className="flex flex-col gap-2 rounded-xl border border-dashed border-line p-4"
    >
      <h2 id="restaurar" className="font-bold">
        Loja de demonstração
      </h2>
      <p className="text-sm text-muted">
        Pode mexer à vontade. Quando quiser, volte a {storeName} aos dados
        originais.
      </p>
      <ConfirmButton
        label="Restaurar dados da demonstração"
        question="Restaurar a loja? Os pedidos são apagados, e os produtos e as categorias voltam ao original."
        confirmLabel="Sim, restaurar"
        onConfirm={() => resetDemo()}
      />
    </section>
  );
}
