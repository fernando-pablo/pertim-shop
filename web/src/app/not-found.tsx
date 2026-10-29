import Link from 'next/link';

/** Página para endereço que não existe (loja ou produto). */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-bold tracking-widest text-accent-ink uppercase">
        Pertim Shop
      </p>
      <h1 className="text-3xl font-extrabold">Não achamos essa página</h1>
      <p className="text-muted">
        A loja ou o produto pode ter mudado de endereço.
      </p>
      <Link
        href="/"
        className="rounded-store bg-primary px-6 py-3 font-bold text-on-primary no-underline"
      >
        Ver as lojas
      </Link>
    </main>
  );
}
