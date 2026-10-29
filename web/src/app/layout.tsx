import type { Metadata, Viewport } from 'next';
// Fontes das lojas, guardadas no próprio projeto (Fontsource): o site não
// depende do Google para carregar, e o navegador só baixa as que a loja usa.
import '@fontsource-variable/baloo-2';
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import '@fontsource-variable/nunito';
import '@fontsource/bebas-neue';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: "Pertim Shop: tudo pertim d'ocê",
    template: '%s | Pertim Shop',
  },
  description:
    'Plataforma de pedidos para pequenos comércios: cada loja com o seu link e o seu visual, e o pedido chegando pronto no WhatsApp.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
