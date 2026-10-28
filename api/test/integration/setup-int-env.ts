/**
 * Testes de integração: usam um PostgreSQL de verdade (o do Docker, por
 * exemplo) para testar transações, estoque e isolamento entre lojas.
 * ATENÇÃO: as lojas de demonstração do banco são restauradas a cada teste.
 */
if (!process.env.DATABASE_URL) {
  throw new Error(
    'Defina DATABASE_URL. Ex.: DATABASE_URL=postgresql://pertim:pertim@localhost:5433/pertim npm run test:int',
  );
}
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.JWT_SECRET ??= 'segredo-dos-testes';
process.env.DEMO_PASSWORD ??= 'pertim-demo';
