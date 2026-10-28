// Configuração do Prisma (ferramenta de linha de comando).
// Fora do Docker, lê o DATABASE_URL do arquivo api/.env.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
