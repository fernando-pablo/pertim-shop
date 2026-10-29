'use client';

import { removeProduct } from '@/app/painel/produtos/actions';
import { ConfirmButton } from './feedback';

/** Apagar o produto (pede confirmação). Pedidos antigos não mudam. */
export function DeleteProduct({ id, name }: { id: string; name: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-muted">
        Se for só por um tempo, prefira pausar. Pedidos antigos continuam com o
        nome e o preço de quando foram feitos.
      </p>
      <ConfirmButton
        label={`Apagar ${name}`}
        question={`Apagar "${name}" de vez? Isso não tem volta.`}
        confirmLabel="Sim, apagar"
        onConfirm={() => removeProduct(id)}
      />
    </div>
  );
}
