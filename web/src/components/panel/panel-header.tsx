import Link from 'next/link';
import { signOut } from '@/app/painel/actions';
import type { PanelSession } from '@/lib/types';

export type PanelSection = 'pedidos' | 'produtos' | 'categorias';

const SECTIONS: { id: PanelSection; label: string; href: string }[] = [
  { id: 'pedidos', label: 'Pedidos', href: '/painel' },
  { id: 'produtos', label: 'Produtos', href: '/painel/produtos' },
  { id: 'categorias', label: 'Categorias', href: '/painel/categorias' },
];

/** Topo do painel: loja logada, link para a vitrine, "Sair" e o menu. */
export function PanelHeader({
  session,
  current,
}: {
  session: PanelSession;
  current: PanelSection;
}) {
  const { store } = session;
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-3">
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
      <nav
        aria-label="Menu do painel"
        className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2"
      >
        {SECTIONS.map((section) => {
          const active = section.id === current;
          return (
            <Link
              key={section.id}
              href={section.href}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 border-b-3 px-3 py-3 text-sm font-bold no-underline ${
                active
                  ? 'border-primary text-ink'
                  : 'border-transparent text-muted'
              }`}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
