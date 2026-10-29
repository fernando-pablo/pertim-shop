'use client';

import { type FormEvent, useState, useTransition } from 'react';
import { startSession } from '@/app/painel/actions';
import { loginAtApi } from '@/lib/panel-login';
import { SEGMENT_LABELS } from '@/lib/theme';
import type { StoreSummary } from '@/lib/types';
import { StoreLogo, StoreTheme } from '../store-theme';

type Where = 'demo' | 'email';

/** Mensagem de erro; o leitor de tela anuncia quando ela muda. */
function ErrorText({ text }: { text: string | null }) {
  return (
    <p
      aria-live="assertive"
      className="rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-900 empty:hidden"
    >
      {text}
    </p>
  );
}

const inputClass =
  'h-12 rounded-xl border border-line bg-surface px-4 text-ink placeholder:text-muted';

/**
 * Entrada do painel: um clique numa loja de demonstração, ou e-mail e
 * senha. O navegador fala direto com a API (o limite de tentativas conta
 * o IP de cada pessoa) e depois entrega o token para o servidor da vitrine
 * guardar no cookie protegido.
 */
export function LoginForms({
  apiUrl,
  demoStores,
  expired,
}: {
  apiUrl: string;
  demoStores: StoreSummary[];
  expired: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // O erro aparece perto do botão que a pessoa clicou.
  const [error, setError] = useState<{ where: Where; text: string } | null>(
    null,
  );
  const [waiting, setWaiting] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const busy = waiting !== null || saving;

  async function login(
    path: '/auth/login' | '/auth/demo-login',
    body: object,
    key: string,
  ) {
    const where: Where = key === 'email' ? 'email' : 'demo';
    setError(null);
    setWaiting(key);
    const outcome = await loginAtApi(apiUrl, path, body);
    if ('error' in outcome) {
      setError({ where, text: outcome.error });
      setWaiting(null);
      return;
    }
    startSaving(async () => {
      // Deu certo: o servidor guarda o cookie e abre o painel.
      const result = await startSession(outcome.token);
      if (result) setError({ where, text: result.error });
      setWaiting(null);
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError({ where: 'email', text: 'Informe o e-mail e a senha.' });
      return;
    }
    void login('/auth/login', { email, password }, 'email');
  }

  return (
    <div className="flex flex-col gap-6">
      {expired && (
        <p className="rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-950">
          Seu login venceu. Entre de novo para continuar.
        </p>
      )}

      {demoStores.length > 0 && (
        <section aria-labelledby="demo" className="flex flex-col gap-3">
          <div>
            <h2 id="demo" className="text-xl font-bold">
              Conhecer o painel
            </h2>
            <p className="text-sm text-muted">
              Entre numa loja de demonstração com um clique.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {demoStores.map((store) => (
              <li key={store.slug}>
                <StoreTheme store={store} className="bg-bg">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void login(
                        '/auth/demo-login',
                        { slug: store.slug },
                        store.slug,
                      )
                    }
                    className="flex w-full items-center gap-4 border border-line p-4 text-left text-ink disabled:opacity-60"
                  >
                    <StoreLogo store={store} size={44} square />
                    <span className="flex flex-1 flex-col gap-1">
                      <span className="font-heading text-xl leading-none font-semibold">
                        {store.name}
                      </span>
                      <span className="text-sm text-muted">
                        {SEGMENT_LABELS[store.segment]}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-accent-ink">
                      {waiting === store.slug ? 'Entrando…' : 'Entrar'}
                    </span>
                  </button>
                </StoreTheme>
              </li>
            ))}
          </ul>
          <ErrorText text={error?.where === 'demo' ? error.text : null} />
        </section>
      )}

      <section aria-labelledby="minha-loja" className="flex flex-col gap-3">
        <h2 id="minha-loja" className="text-xl font-bold">
          Já tenho uma loja
        </h2>
        <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            E-mail
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Senha
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="h-12 rounded-xl bg-primary font-bold text-on-primary disabled:opacity-60"
          >
            {waiting === 'email' ? 'Entrando…' : 'Entrar'}
          </button>
          <ErrorText text={error?.where === 'email' ? error.text : null} />
        </form>
      </section>
    </div>
  );
}
