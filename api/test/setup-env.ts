// Valores de exemplo só para os testes e2e (a conexão real é substituída por mocks).
process.env.DATABASE_URL ??= 'postgresql://pertim:pertim@localhost:5433/pertim';
process.env.REDIS_URL ??= 'redis://localhost:6379';
