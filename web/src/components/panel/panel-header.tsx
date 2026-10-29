import Link from 'next/link';
import { signOut } from '@/app/painel/actions';
import type { PanelSession } from '@/lib/types';

/** Topo do painel: marca, loja logada, link para a vitrine e "Sair". */
export function PanelHeader({ session }: { session: PanelSession }) {
  const { store } = session;
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-widest text-accent-ink uppercase">
            Painel Pertim Shop
          </p>
          <p className="flex items-center gap-2 truncate text-lg font-bold">
            {store.name}
            {store.isDemo && (
              <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-bg">
                Demonstração
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm font-semibold">
          <Link
            href={`/${store.slug}`}
            className="rounded-xl px-3 py-2 text-ink underline"
          >
            Ver a loja
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-xl border border-line px-3 py-2 text-ink"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
