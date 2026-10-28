# Receita da "caixa" (imagem) da API.
# Feita em 3 etapas para a imagem final ficar pequena: só leva o que roda.

# ---------- Etapa 1: instalar as dependências ----------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Etapa 2: compilar o TypeScript para JavaScript ----------
FROM deps AS build
COPY . .
RUN npm run build && npm prune --omit=dev

# ---------- Etapa 3: imagem final, só com o necessário para rodar ----------
FROM node:24-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

# Roda com um usuário comum, não como administrador (mais seguro).
USER node
EXPOSE 3333
CMD ["node", "dist/main.js"]
