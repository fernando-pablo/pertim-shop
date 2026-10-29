/**
 * Testes de integração: usam um PostgreSQL e um Redis de verdade (os do
 * Docker, por exemplo) para testar transações, estoque, isolamento entre
 * lojas, cache e limite de tentativas.
 * ATENÇÃO: as lojas de demonstração do banco são restauradas a cada teste,
 * e o banco 15 do Redis é apagado (a API usa o banco 0).
 */
if (!process.env.DATABASE_URL) {
  throw new Error(
    'Defina DATABASE_URL. Ex.: DATABASE_URL=postgresql://pertim:pertim@localhost:5433/pertim npm run test:int',
  );
}
process.env.REDIS_URL ??= 'redis://localhost:6379/15';
process.env.JWT_SECRET ??= 'segredo-dos-testes';
process.env.DEMO_PASSWORD ??= 'pertim-demo';
