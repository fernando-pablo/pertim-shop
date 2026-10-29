/**
 * "Esqueletos": aparecem na hora, enquanto os dados da loja chegam da API
 * (streaming). Não sabem ainda as cores da loja, então são neutros.
 */

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-ink/10 ${className}`} />;
}

export function StoreSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando a loja"
      className="mx-auto max-w-3xl px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <Block className="size-10" />
        <Block className="h-6 w-40" />
      </div>
      <Block className="mt-5 h-40" />
      <Block className="mt-4 h-4 w-3/4" />
      <Block className="mt-5 h-12" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Block className="aspect-[4/5]" />
        <Block className="aspect-[4/5]" />
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando o produto"
      className="mx-auto max-w-3xl px-4 py-3"
    >
      <Block className="h-10 w-48" />
      <Block className="mt-4 aspect-square sm:aspect-[4/3]" />
      <Block className="mt-5 h-7 w-2/3" />
      <Block className="mt-3 h-5 w-24" />
      <Block className="mt-6 h-12" />
    </div>
  );
}
