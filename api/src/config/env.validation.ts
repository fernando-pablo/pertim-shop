/**
 * Variáveis de ambiente obrigatórias.
 * No Docker elas vêm do docker-compose.yml; em produção, do painel da hospedagem.
 * Senhas e endereços nunca ficam escritos no código.
 */
const REQUIRED_VARIABLES = ['DATABASE_URL', 'REDIS_URL'] as const;

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_VARIABLES.filter((name) => !config[name]);

  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente faltando: ${missing.join(', ')}. ` +
        'Veja o arquivo .env.example.',
    );
  }

  return config;
}
