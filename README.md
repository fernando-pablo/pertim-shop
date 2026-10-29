# Pertim Shop

**Tudo pertim d'ocê.**

Plataforma de pedidos para pequenos comércios. Várias lojas num sistema só, cada uma com o seu link e o seu visual, e o pedido saindo pronto para o WhatsApp.

> 🚧 **Em construção.** Etapa **2 de 5 concluída: a API** (catálogo, pedidos, login e painel do lojista). Etapa 3 em andamento: cache e limite de tentativas já prontos.

## Tecnologias

| Parte | Tecnologia |
|---|---|
| API | [Nest.js](https://nestjs.com) 12 com TypeScript, rodando em Node.js 24 |
| Banco de dados | PostgreSQL 17 com [Prisma](https://www.prisma.io) 7 (ORM e migrations) |
| Cache e limite de tentativas | Redis 7 (ioredis) |
| Documentação | Swagger (OpenAPI), em `/docs` |
| Infraestrutura | Docker e Docker Compose |
| Login | JWT (JSON Web Token) e senhas com bcrypt |
| Testes | Jest: unidade, ponta a ponta e integração com banco real |

Em breve: testes no GitHub Actions, teste de carga e vitrine em Next.js.

## Como rodar

**Pré-requisito:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e aberto.

Na pasta do projeto:

```bash
docker compose up --build
```

O comando sobe a **API**, o **PostgreSQL** e o **Redis**, cria as tabelas (migrations) e, se o banco estiver vazio, cria três lojas de demonstração. Depois abra no navegador:

- http://localhost:3333/docs: documentação interativa (Swagger)
- http://localhost:3333/stores: lojas da plataforma
- http://localhost:3333/health: saúde da API

Para desligar, use `Ctrl + C` ou rode `docker compose down`.

### Lojas de demonstração

| Loja | Segmento | Endereço |
|---|---|---|
| Moda Chic | Roupas e acessórios | `/stores/moda-chic` |
| Fome-Sô | Lanchonete | `/stores/fome-so` |
| Bicho Bão Pet Shop | Pet shop | `/stores/bicho-bao` |

Todas usam a mesma API. O que muda é o tema (cores, fontes, logo), que fica salvo no banco.

**Para testar o painel no Swagger:**

1. Em `POST /auth/demo-login`, envie `{ "slug": "fome-so" }` e copie o `accessToken`.
2. Clique em **Authorize** no topo da página e cole o token.
3. Pronto: as rotas `/panel/...` passam a responder com os dados da Fome-Sô.

Também dá para entrar com e-mail e senha: `lojista@fome-so.pertim.example` e `pertim-demo`.

### Testes

```bash
cd api
npm install
npm test           # testes de unidade
npm run test:e2e   # testes de ponta a ponta (banco e Redis simulados)
```

Os **testes de integração** usam o PostgreSQL e o Redis de verdade. Com o Docker ligado:

```bash
DATABASE_URL=postgresql://pertim:pertim@localhost:5433/pertim npm run test:int
```

> Os testes de integração restauram as lojas de demonstração e usam o banco 15 do Redis (a API usa o banco 0). Os testes precisam do Node.js 24.9 ou mais novo.

## Endereços da API

| Método | Endereço | O que faz |
|---|---|---|
| GET | `/stores` | Lista as lojas ativas |
| GET | `/stores/:slug` | Dados da loja e tema (visual) |
| GET | `/stores/:slug/categories` | Categorias, com a quantidade de produtos |
| GET | `/stores/:slug/products` | Produtos, com filtro `?category=` e busca `?search=` |
| GET | `/stores/:slug/products/:id` | Produto completo: variações e adicionais |
| POST | `/stores/:slug/orders` | Cria o pedido e devolve a mensagem pronta do WhatsApp |
| POST | `/auth/login` | Login do lojista (e-mail e senha) |
| POST | `/auth/demo-login` | Login com um clique nas lojas de demonstração |
| GET | `/health` | Confere a API, o banco e o Redis |

**Limite de tentativas** (por IP): login, 10 a cada 15 minutos; login de demonstração, 30 a cada 15 minutos; pedidos, 20 a cada 10 minutos em cada loja. Passou disso, a API responde `429` com o cabeçalho `Retry-After` (quantos segundos esperar).

**Painel do lojista** (exigem login; a loja vem do token, nunca do endereço):

| Método | Endereço | O que faz |
|---|---|---|
| GET | `/panel/store` | Dados da minha loja |
| GET, POST, PATCH, DELETE | `/panel/categories` | Categorias |
| GET, POST, PATCH, DELETE | `/panel/products` | Produtos |
| POST, PATCH, DELETE | `/panel/products/:id/variants` | Variações e estoque |
| PUT | `/panel/products/:id/addon-groups` | Adicionais |
| GET | `/panel/orders` | Pedidos, com filtro por status e paginação |
| PATCH | `/panel/orders/:id/status` | Muda o status (cancelar devolve o estoque) |
| POST | `/panel/demo/reset` | Restaura os dados originais (só lojas de demonstração) |

## Banco de dados

```mermaid
erDiagram
    STORE ||--o{ MERCHANT : "tem lojistas"
    STORE ||--o{ CATEGORY : "tem"
    STORE ||--o{ PRODUCT : "vende"
    STORE ||--o{ ORDER : "recebe"
    CATEGORY ||--o{ PRODUCT : "agrupa"
    PRODUCT ||--o{ PRODUCT_VARIANT : "tem variações (estoque)"
    PRODUCT ||--o{ ADDON_GROUP : "tem adicionais"
    ADDON_GROUP ||--o{ ADDON : "contém"
    ORDER ||--o{ ORDER_ITEM : "contém"

    STORE {
        uuid id
        string slug "endereço: moda-chic"
        enum segment
        json theme "cores, fontes, logo"
        int last_order_number "contador dos pedidos"
    }
    PRODUCT {
        uuid id
        uuid store_id
        int price_cents "R$ 19,90 = 1990"
    }
    PRODUCT_VARIANT {
        string name "M / Azul, 15 kg"
        int price_cents "opcional"
        int stock "vazio = sem controle"
    }
    ORDER_ITEM {
        string product_name "congelado no pedido"
        int unit_price_cents "congelado no pedido"
    }
```

O desenho completo fica em [`api/prisma/schema.prisma`](api/prisma/schema.prisma).

## Estrutura

```
pertim-shop/
├── api/                    API em Nest.js
│   ├── prisma/             desenho do banco (schema) e migrations
│   ├── src/
│   │   ├── stores/         lojas e temas
│   │   ├── catalog/        categorias e produtos (vitrine)
│   │   ├── orders/         pedidos, cálculo e mensagem do WhatsApp
│   │   ├── auth/           login do lojista (JWT)
│   │   ├── panel/          painel do lojista
│   │   ├── demo/           dados das lojas de demonstração
│   │   ├── prisma/         conexão com o banco
│   │   ├── redis/          conexão com o Redis
│   │   ├── cache/          cache da vitrine no Redis
│   │   ├── rate-limit/     limite de tentativas
│   │   ├── health/         endpoint /health
│   │   └── config/         validação das variáveis de ambiente
│   ├── test/               testes de ponta a ponta e de integração
│   └── Dockerfile          receita da imagem da API
├── docker-compose.yml      sobe API, PostgreSQL e Redis juntos
└── .env.example            modelo das configurações
```

## Decisões técnicas

- **Uma plataforma para várias lojas.** Um sistema só atende todos os comércios. Cliente novo vira um cadastro, não um projeto novo. *Para um único cliente, um site em Next.js com Supabase bastaria.*
- **Isolamento entre lojas.** Toda consulta filtra pelo id da loja. No painel, a loja vem do token do login, nunca do endereço. Um produto ou pedido de outra loja responde "não encontrado", mesmo com o id certo. Há testes de integração que tentam mexer na loja dos outros.
- **O servidor calcula o pedido.** O carrinho manda só produto, variação, quantidade e adicionais. O preço sai sempre do banco, e campos extras (como um "total" inventado) são recusados.
- **Estoque sem venda dobrada.** O estoque baixa num único comando do banco, que só funciona se ainda houver quantidade ("diminua 1, se tiver pelo menos 1"). Num teste com 6 clientes disputando 2 unidades ao mesmo tempo, exatamente 2 conseguem.
- **Pedido "congelado".** Nome, preço e adicionais ficam gravados no pedido. Se o produto mudar depois, o pedido antigo continua igual.
- **Número do pedido por loja.** Cada loja tem os seus #1, #2, #3..., gerados por um contador que não repete nem pula, mesmo com pedidos simultâneos.
- **Fluxo de status.** Um pedido "Novo" não vai direto para "Concluído", e cancelar devolve o estoque reservado.
- **Login sem sessão no servidor (JWT).** A API não guarda quem está logado; tudo está no token assinado. Por isso dá para rodar várias cópias da API. As senhas são guardadas com bcrypt, e o login responde igual para e-mail inexistente e senha errada.
- **O visual é um dado, não código.** O tema de cada loja (cores, fontes, logo) fica no banco. Criar uma loja nova ou mudar o visual não exige programar.
- **Um formato de produto para todos os segmentos.** As *variações* (tamanho, cor, peso, voltagem) guardam preço e estoque; os *adicionais* (bacon, ponto da carne) têm mínimo e máximo de escolhas. Serve para loja de roupas, lanchonete e pet shop.
- **Preços em centavos.** R$ 19,90 é guardado como 1990, o que evita erros de arredondamento.
- **O estoque exato não é público.** A vitrine recebe só "disponível" e "últimas unidades".
- **As fotos ficam fora da API.** Elas são servidas pela vitrine, e a API só guarda o caminho. Isso economiza o tráfego do servidor.
- **Migrations versionadas.** Cada mudança no banco vira um arquivo SQL no repositório, e qualquer máquina recria o banco igual.
- **Dados de demonstração num lugar só.** A mesma função cria as lojas no primeiro start e restaura a loja no botão "restaurar dados", mantendo o id da loja e do lojista (quem está logado continua logado).
- **Docker.** Qualquer pessoa clona o repositório e roda tudo com um comando. A imagem tem 3 etapas, leva só o necessário e roda sem permissão de administrador. *Seria exagero num site estático, sem banco.*
- **Cache da vitrine com versão por loja.** A vitrine é muito lida e pouco alterada, então as respostas ficam no Redis por 10 minutos. Cada loja tem uma "versão" do catálogo, e as respostas são guardadas junto com ela. Quando o lojista muda algo no painel, ou um pedido baixa o estoque, a loja ganha uma versão nova e a vitrine mostra a mudança na hora. Uma resposta antiga que chegue atrasada fica presa à versão velha e nunca é lida.
- **A invalidação fica num lugar só.** Um *interceptor* do Nest apaga o cache depois de qualquer alteração nas rotas de catálogo do painel. Rota nova já nasce apagando o cache, sem ninguém precisar lembrar. Pedidos de produtos sem controle de estoque (lanches) não apagam o cache.
- **O que vai para o cache.** A lista completa de produtos, as categorias, cada produto e os dados da loja. Busca e filtro vão direto ao banco, para ninguém conseguir encher a memória do Redis inventando buscas. Endereço ou produto que não existe também não é guardado. O pedido consulta preço e estoque sempre no banco, nunca no cache.
- **Limite de tentativas com contador no Redis.** Cada IP tem um contador com prazo de validade (`INCR` com `EX`). Isso protege o login contra quem tenta adivinhar senhas e os pedidos contra robôs. O contador fica no Redis, e não na memória da API, para valer igual em todas as cópias da API.
- **Se o Redis cair, a loja continua vendendo.** Sem Redis, a vitrine busca direto no banco e o limite de tentativas fica desligado. O `/health` avisa o problema, e o log registra no máximo um aviso por minuto. *A escolha foi priorizar a loja aberta em vez da proteção.*
- **`/health` responde 503 quando algo cai.** A hospedagem usa esse código para saber que a API não está saudável.
- **Nenhum arquivo passa de 300 linhas.** Uma regra automática do linter (oxlint) impede arquivos gigantes.
- **Configuração por variáveis de ambiente.** Senhas e endereços não ficam no código. Se faltar alguma variável, a API avisa qual é e não liga.

## Roteiro

- [x] **Etapa 1:** ambiente com Docker (API, PostgreSQL e Redis)
- [x] **Etapa 2:** API
  - [x] banco de dados, lojas de demonstração, catálogo e Swagger
  - [x] pedidos, login do lojista (JWT) e painel
- [ ] **Etapa 3:** desempenho e automação
  - [x] cache da vitrine e limite de tentativas com Redis
  - [ ] testes no GitHub Actions e teste de carga
- [ ] **Etapa 4:** vitrine em Next.js e painel do lojista
- [ ] **Etapa 5:** publicação (Render, Neon e Vercel)

## Autor

**Fernando Pablo**, da [Lychnos Tech](https://lychnos-portfolio.vercel.app)
[LinkedIn](https://www.linkedin.com/in/fernandopablogomes) · [GitHub](https://github.com/fernando-pablo)
