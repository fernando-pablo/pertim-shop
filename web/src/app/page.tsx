import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { ContactLink } from '@/components/contact-link';
import { StoreLogo, StoreTheme } from '@/components/store-theme';
import { getStores } from '@/lib/api';
import { SEGMENT_LABELS } from '@/lib/theme';
import heroPhoto from '@/assets/topo-shopping.webp';

/** Página inicial: a marca Pertim Shop e as lojas da plataforma. */
export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <header className="relative isolate overflow-hidden bg-[#14110d]">
        {/* Foto de um shopping à noite, bem desfocada: só as luzes aparecem. */}
        <Image
          src={heroPhoto}
          alt=""
          fill
          preload
          placeholder="blur"
          sizes="100vw"
          className="-z-10 object-cover"
        />
        {/* Escurece a foto para o texto ficar sempre legível. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-b from-black/40 via-black/25 to-black/60"
        />
        <nav
          aria-label="Páginas"
          className="mx-auto flex max-w-3xl justify-end px-4 pt-4"
        >
          <Link
            href="/sobre"
            className="px-1 py-2 text-sm font-semibold text-white underline drop-shadow"
          >
            Sobre
          </Link>
        </nav>
        <div className="mx-auto flex min-h-[22rem] max-w-3xl flex-col justify-end gap-4 px-4 pt-6 pb-12 sm:min-h-[27rem] sm:pb-16">
          <h1 className="text-6xl leading-none font-extrabold tracking-tight text-white drop-shadow-lg sm:text-8xl">
            Pertim <span className="text-[#F2B705]">Shop</span>
          </h1>
          <p className="text-2xl font-semibold text-white drop-shadow sm:text-3xl">
            Tudo pertim d&apos;ocê.
          </p>
          <p className="max-w-md text-base text-white/80 sm:text-lg">
            Plataforma de pedidos para pequenos comércios. Cada loja com o seu
            link e o seu visual, e o pedido chegando pronto no WhatsApp.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-10">
        <h2 id="lojas" className="text-2xl font-bold">
          Conheça as lojas
        </h2>
        <Suspense fallback={<p className="text-muted">Carregando as lojas…</p>}>
          <StoreCards />
        </Suspense>

        <section
          aria-labelledby="contato"
          className="mt-8 flex flex-col items-start gap-3 bg-[#1F1A14] p-6 text-[#FAF6EF]"
        >
          <h2 id="contato" className="text-2xl font-bold">
            Quer um sistema assim para o seu comércio?
          </h2>
          <p className="text-[#FAF6EF]/80">
            O seu próprio link de pedidos, com o visual da sua loja e o pedido
            chegando pronto no WhatsApp.
          </p>
          <ContactLink className="bg-[#F2B705] px-5 py-3 font-bold text-[#1F1A14] no-underline">
            Quero um sistema assim
          </ContactLink>
        </section>
      </main>
      <footer className="flex flex-col items-center gap-3 px-4 pb-10 text-center text-sm text-muted">
        <nav aria-label="Rodapé" className="flex gap-5">
          <Link href="/sobre" className="font-semibold text-ink underline">
            Sobre
          </Link>
          <Link href="/painel" className="font-semibold text-ink underline">
            Área do lojista
          </Link>
        </nav>
        <p>
          Um projeto da{' '}
          <a
            href="https://lychnos-portfolio.vercel.app"
            className="font-semibold text-muted underline"
          >
            Lychnos Tech
          </a>
          .
        </p>
      </footer>
    </div>
  );
}

async function StoreCards() {
  const stores = await getStores();
  if (stores.length === 0) {
    return <p className="text-muted">Nenhuma loja por aqui ainda.</p>;
  }
  return (
    <ul aria-labelledby="lojas" className="flex flex-col gap-3 sm:max-w-sm">
      {stores.map((store) => (
        <li key={store.slug}>
          {/* Cada cartão já mostra as cores e as fontes da própria loja. */}
          <StoreTheme store={store} className="bg-bg">
            <Link
              href={`/${store.slug}`}
              className="flex items-center gap-4 border border-line p-4 text-ink no-underline"
            >
              <StoreLogo store={store} size={52} square />
              <span className="flex flex-col gap-1">
                <span className="font-heading text-2xl leading-none font-semibold">
                  {store.name}
                </span>
                <span className="text-sm text-muted">
                  {SEGMENT_LABELS[store.segment]}
                </span>
              </span>
            </Link>
          </StoreTheme>
        </li>
      ))}
    </ul>
  );
}
