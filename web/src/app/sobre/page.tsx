import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ContactLink } from '@/components/contact-link';
import { BackIcon } from '@/components/icons';
import heroPhoto from '@/assets/topo-shopping.webp';

export const metadata: Metadata = {
  title: 'Sobre',
  description:
    'Como funciona o Pertim Shop: várias lojas num lugar só, cada uma com o seu link, o seu visual e o seu painel, e o pedido chegando pronto no WhatsApp.',
};

const STEPS = [
  {
    title: 'O cliente escolhe',
    text: 'Abre o link da loja no celular, vê os produtos com foto e preço e monta o carrinho.',
  },
  {
    title: 'O pedido chega pronto',
    text: 'Itens, opções, total e endereço vão organizados para o WhatsApp da loja.',
  },
  {
    title: 'O lojista acompanha',
    text: 'No painel, confirma, prepara e conclui cada pedido, e muda produtos e preços na hora.',
  },
];

const MERCHANT = [
  'O seu próprio link de pedidos, sem pagar comissão por pedido.',
  'Produtos, preços, estoque e adicionais mudados pelo painel, e a loja muda na hora.',
  'Funciona no celular do cliente, sem ele precisar instalar nada.',
];

const CUSTOM = [
  'As cores, as fontes e o logo da sua loja.',
  'Um QR Code para divulgar no balcão, na mesa ou na vitrine.',
  'A loja e o painel instalados no celular, como um aplicativo.',
];

/** Página "Sobre": a plataforma explicada em linguagem simples. */
export default function AboutPage() {
  return (
    <div className="min-h-dvh">
      <header className="relative isolate overflow-hidden bg-[#14110d] text-white">
        <Image
          src={heroPhoto}
          alt=""
          fill
          placeholder="blur"
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-b from-black/50 to-black/70"
        />
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pt-6 pb-10">
          <Link
            href="/"
            className="flex w-fit items-center gap-1 text-sm font-semibold text-white no-underline"
          >
            <BackIcon size={18} /> Início
          </Link>
          <h1 className="mt-6 text-4xl leading-tight font-extrabold sm:text-5xl">
            Sobre o Pertim <span className="text-[#F2B705]">Shop</span>
          </h1>
          <p className="max-w-xl text-lg text-white/85">
            Uma plataforma de pedidos para pequenos comércios. Funciona como um
            shopping: várias lojas no mesmo lugar, cada uma com a sua vitrine, o
            seu visual e o seu painel.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10">
        <section aria-labelledby="como" className="flex flex-col gap-4">
          <h2 id="como" className="text-2xl font-bold">
            Como funciona
          </h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col gap-2 border border-line bg-surface p-4"
              >
                <span className="flex size-9 items-center justify-center bg-[#F2B705] font-bold text-[#1F1A14]">
                  {index + 1}
                </span>
                <span className="font-bold">{step.title}</span>
                <span className="text-sm text-muted">{step.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="comerciante" className="flex flex-col gap-3">
          <h2 id="comerciante" className="text-2xl font-bold">
            Para o comerciante
          </h2>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {MERCHANT.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="medida" className="flex flex-col gap-3">
          <h2 id="medida" className="text-2xl font-bold">
            Sob medida
          </h2>
          <p className="text-muted">
            Cada comércio é de um jeito. Na conversa, dá para combinar:
          </p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {CUSTOM.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="dentro" className="flex flex-col gap-3">
          <h2 id="dentro" className="text-2xl font-bold">
            Por dentro
          </h2>
          <p className="text-muted">
            Feito com Next.js, Nest.js, PostgreSQL, Redis e Docker, com testes
            automáticos a cada mudança.{' '}
            <a
              href="https://github.com/fernando-pablo/pertim-shop"
              className="font-semibold text-ink underline"
            >
              Ver o código no GitHub
            </a>
            .
          </p>
        </section>

        <section className="flex flex-col items-start gap-3 bg-[#1F1A14] p-6 text-[#FAF6EF]">
          <h2 className="text-2xl font-bold">Gostou?</h2>
          <p className="text-[#FAF6EF]/80">
            Experimente as lojas de demonstração ou entre em contato.
          </p>
          <div className="flex flex-wrap gap-3">
            <ContactLink className="bg-[#F2B705] px-5 py-3 font-bold text-[#1F1A14] no-underline">
              Quero um sistema assim
            </ContactLink>
            <Link
              href="/#lojas"
              className="border border-[#FAF6EF]/40 px-5 py-3 font-bold text-[#FAF6EF] no-underline"
            >
              Conheça as lojas
            </Link>
          </div>
        </section>
      </main>

      <footer className="px-4 pb-10 text-center text-sm text-muted">
        Um projeto da{' '}
        <a
          href="https://lychnos-portfolio.vercel.app"
          className="font-semibold text-muted underline"
        >
          Lychnos Tech
        </a>
        .
      </footer>
    </div>
  );
}
