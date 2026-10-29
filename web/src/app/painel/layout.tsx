import type { Metadata } from 'next';

/** Painel do lojista: usa as cores da Pertim Shop e fica fora do Google. */
export const metadata: Metadata = {
  title: {
    default: 'Painel do lojista',
    template: '%s | Painel Pertim Shop',
  },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: LayoutProps<'/painel'>) {
  return <div className="min-h-dvh bg-bg text-ink">{children}</div>;
}
