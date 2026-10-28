# Receita da "caixa" (imagem) da API.
# Feita em 3 etapas para a imagem final ficar pequena: só leva o que roda.

# ---------- Etapa 1: instalar as dependências ----------
FROM node:24-alpine AS deps
# O Prisma precisa do OpenSSL para rodar as migrations no Alpine.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Etapa 2: gerar o cliente do Prisma e compilar o TypeScript ----------
FROM deps AS build
COPY . .
# "npm run build" roda antes o "prisma generate" (script prebuild).
RUN npm run build && npm prune --omit=dev

# ---------- Etapa 3: imagem final, só com o necessário para rodar ----------
FROM node:24-alpine AS runner
RUN apk add --no-cache openssl
ENV NODE_ENV=production
# Desliga a checagem de novas versões do Prisma ao rodar comandos.
ENV CHECKPOINT_DISABLE=1
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./

# Roda com um usuário comum, não como administrador (mais seguro).
USER node
EXPOSE 3333

# Ao ligar: aplica as migrations, cria as lojas de demonstração se o banco
# estiver vazio e sobe a API. O "exec" deixa a API receber o sinal de desligar.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/demo/seed.cli.js --if-empty && exec node dist/main.js"]
