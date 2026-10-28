# Pertim Shop

**Tudo pertim d'ocê.**

Plataforma de pedidos para pequenos comércios. Várias lojas num sistema só, cada uma com o seu link e o seu visual, e o pedido saindo pronto para o WhatsApp.

> 🚧 **Em construção.** Etapa atual: **1 de 5, ambiente com Docker.**

## Tecnologias

| Parte | Tecnologia |
|---|---|
| API | [Nest.js](https://nestjs.com) 12 com TypeScript, rodando em Node.js 24 |
| Banco de dados | PostgreSQL 17 |
| Cache | Redis 7 |
| Infraestrutura | Docker e Docker Compose |
| Testes | Jest (testes de unidade e de ponta a ponta) |

Em breve: Swagger, testes no GitHub Actions e vitrine em Next.js.

## Como rodar

**Pré-requisito:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e aberto.

Na pasta do projeto:

```bash
docker compose up --build
```

O comando sobe três contêineres: a **API**, o **PostgreSQL** e o **Redis**. Depois abra no navegador:

- http://localhost:3333: informações da API
- http://localhost:3333/health: saúde da API

Resposta esperada do `/health`:

```json
{ "status": "ok", "api": "ok", "database": "ok", "redis": "ok" }
```

Para desligar, use `Ctrl + C` ou rode `docker compose down`.

### Testes

```bash
cd api
npm install
npm test           # testes de unidade
npm run test:e2e   # testes de ponta a ponta
```

> Os testes precisam do Node.js 24.9 ou mais novo.

## Estrutura

```
pertim-shop/
├── api/                    API em Nest.js
│   ├── src/
│   │   ├── config/         validação das variáveis de ambiente
│   │   ├── database/       conexão com o PostgreSQL
│   │   ├── redis/          conexão com o Redis
│   │   └── health/         endpoint /health
│   ├── test/               testes de ponta a ponta
│   └── Dockerfile          receita da imagem da API
├── docker-compose.yml      sobe API, PostgreSQL e Redis juntos
└── .env.example            modelo das configurações
```

## Decisões técnicas

- **Uma plataforma para várias lojas.** Um sistema só atende todos os comércios, e cada loja vê apenas os próprios dados. Cliente novo vira um cadastro, não um projeto novo. *Para um único cliente, um site em Next.js com Supabase bastaria.*
- **Docker.** Qualquer pessoa clona o repositório e roda o projeto inteiro com um comando, sem instalar PostgreSQL nem Redis. A mesma imagem que roda aqui roda no servidor. *Seria exagero num site estático, sem banco.*
- **Imagem em 3 etapas.** A imagem final leva só o código compilado e as dependências de produção, e roda com um usuário sem permissão de administrador.
- **`/health` responde 503 quando algo cai.** A hospedagem usa esse código para saber que a API não está saudável. Os testes simulam banco e Redis fora do ar.
- **Configuração por variáveis de ambiente.** Senhas e endereços não ficam no código. Se faltar alguma variável, a API avisa qual é e não liga.
- **PostgreSQL na porta 5433 do computador.** Assim ele não briga com um PostgreSQL que já esteja instalado na máquina.

## Roteiro

- [x] **Etapa 1:** ambiente com Docker (API, PostgreSQL e Redis)
- [ ] **Etapa 2:** API com lojas, produtos, pedidos, login do lojista e Swagger
- [ ] **Etapa 3:** cache com Redis, limite de pedidos, testes no GitHub Actions e teste de carga
- [ ] **Etapa 4:** vitrine em Next.js e painel do lojista
- [ ] **Etapa 5:** publicação (Render, Neon e Vercel)

## Autor

**Fernando Pablo**, da [Lychnos Tech](https://lychnos-portfolio.vercel.app)
[LinkedIn](https://www.linkedin.com/in/fernandopablogomes) · [GitHub](https://github.com/fernando-pablo)
