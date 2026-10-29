import { PanelApiError } from './panel-api';

/** Resposta das Server Actions do painel para a tela. */
export type ActionResult = { error: string } | { ok: string } | undefined;

/**
 * Roda uma chamada à API. Erro explicado pela API (ex.: "Já existe uma
 * categoria com esse nome") vira mensagem na tela. Login vencido
 * (redirect) e erros inesperados seguem adiante.
 */
export async function callApi(
  work: () => Promise<unknown>,
  ok: string,
): Promise<ActionResult> {
  try {
    await work();
  } catch (error) {
    if (error instanceof PanelApiError) return { error: error.message };
    throw error;
  }
  return { ok };
}
