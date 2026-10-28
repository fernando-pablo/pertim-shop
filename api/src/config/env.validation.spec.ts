import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('aceita quando todas as variáveis obrigatórias existem', () => {
    const config = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'segredo-de-teste',
    };

    expect(validateEnv(config)).toBe(config);
  });

  it('avisa quais variáveis estão faltando', () => {
    expect(() => validateEnv({ DATABASE_URL: 'postgresql://x' })).toThrow(
      'Variáveis de ambiente faltando: REDIS_URL, JWT_SECRET',
    );
  });
});
