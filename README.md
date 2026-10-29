# Pertim Shop

[![CI](https://github.com/fernando-pablo/pertim-shop/actions/workflows/ci.yml/badge.svg)](https://github.com/fernando-pablo/pertim-shop/actions/workflows/ci.yml)

**Tudo pertim d'ocê.**

Plataforma de pedidos para pequenos comércios. Várias lojas num sistema só, cada uma com o seu link e o seu visual, e o pedido saindo pronto para o WhatsApp.

> 🚧 **Em construção.** Etapas **1 a 3 de 5 concluídas:** a API está pronta, com catálogo, pedidos, painel do lojista, cache, limite de tentativas, testes automáticos e teste de carga. **Etapa 4 em andamento:** a vitrine em Next.js já funciona (loja, produto, carrinho e pedido), e o painel do lojista já recebe os pedidos e cuida dos produtos e das categorias; falta o acabamento.

## Tecnologias

| Parte | Tecnologia |
|---|---|
| Vitrine | [Next.js](https://nextjs.org) 16 (App Router, React 19) com TypeScript e Tailwind CSS 4 |
| API | [Nest.js](https://nestjs.com) 12 com TypeScript, rodando em Node.js 24 |
| Banco de dados | PostgreSQL 17 com [Prisma](https://www.prisma.io) 7 (ORM e migrations) |
| Cache e limite de tentativas | Redis 7 (ioredis) |
| Documentação | Swagger (OpenAPI), em `/docs` |
| Infraestrutura | Docker e Docker Compose |
| Login | JWT (JSON Web Token) e senhas com bcrypt |
| Testes | Jest (API), Vitest (vitrine), teste de carga com k6 e GitHub Actions |

## Como rodar

**Pré-requisito:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e aberto.

Na pasta do projeto:

```bash
docker compose up --build
```

O comando sobe a **vitrine**, a **API**, o **PostgreSQL** e o **Redis**, cria as tabelas (migrations) e, se o banco estiver vazio, cria três lojas de demonstração. Depois abra no navegador:

- http://localhost:3000: a vitrine, com as lojas
- http://localhost:3000/painel: o painel do lojista (dá para entrar numa loja de demonstração com um clique)
- http://localhost:3333/docs: documentação interativa da API (Swagger)
- http://localhost:3333/stores: lojas da plataforma
- http://localhost:3333/health: saúde da API

Para desligar, use `Ctrl + C` ou rode `docker compose down`.

### Lojas de demonstração

| Loja | Segmento | Vitrine |
|---|---|---|
| Moda Chic | Roupas e acessórios | http://localhost:3000/moda-chic |
| Fome-Sô | Lanchonete | http://localhost:3000/fome-so |
| Bicho Bão Pet Shop | Pet shop | http://localhost:3000/bicho-bao |

Todas usam o mesmo código. O que muda é o tema (cores, fontes, cantos), que fica salvo no banco. Nas lojas de demonstração o pedido é simulado: em vez de abrir o WhatsApp, a vitrine mostra a mensagem que seria enviada.

As fotos das lojas de demonstração são do [Unsplash](https://unsplash.com) e seguem a [licença do Unsplash](https://unsplash.com/license), que permite o uso gratuito. A lista com o link de cada foto está em [`web/public/demo/CREDITOS.md`](web/public/demo/CREDITOS.md).

**Para testar o painel do lojista:** abra http://localhost:3000/painel e clique numa loja de demonstração. Faça um pedido na vitrine dessa loja: em até 15 segundos ele aparece no painel, onde dá para confirmar, preparar, concluir ou cancelar. Na tela de "pedido criado", o botão "Ver este pedido no painel do lojista" leva direto para o outro lado.

No painel também dá para pausar, destacar, editar e criar produtos (preço, estoque de cada opção e adicionais) e cuidar das categorias. A mudança aparece na vitrine na hora. Nas lojas de demonstração, o botão "Restaurar dados da demonstração" volta tudo ao original.

**Para testar as rotas do painel no Swagger:**

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

Os testes da **vitrine** cobrem o carrinho, as escolhas do produto (tamanho, cor, adicionais) e o pedido:

```bash
cd web
npm install
npm test
```

**No GitHub, tudo roda sozinho a cada push** ([GitHub Actions](.github/workflows/ci.yml)):

- formatação, lint, testes de unidade e de ponta a ponta;
- migrations e testes de integração com PostgreSQL e Redis de verdade;
- build da API;
- na vitrine: formatação, lint, tipos, testes e build;
- montagem das imagens Docker, com a plataforma inteira ligada, o `/health` conferido e a vitrine de uma loja aberta de verdade.

### Teste de carga

O [k6](https://k6.io) simula **50 clientes navegando nas três lojas ao mesmo tempo, por 30 segundos**. Cada cliente abre a loja, as categorias, a lista de produtos e um produto, e repete sem parar. O teste roda duas vezes, com o cache ligado e desligado:

```bash
docker compose up -d --build --wait
docker compose run --rm --no-deps k6               # com cache
CACHE_ENABLED=false docker compose up -d --wait    # desliga o cache
docker compose run --rm --no-deps k6               # sem cache
docker compose up -d --wait                        # liga o cache de novo
```

Os números de cada rodada ficam em [`load-test/results/`](load-test/results).

**Resultado:**

| | Com cache | Sem cache | Diferença |
|---|---|---|---|
| Requisições por segundo | **688,6** | 188,1 | 3,7 vezes mais |
| Tempo médio de resposta | **68,6 ms** | 258,1 ms | 3,8 vezes menor |
| 95% das respostas em até | **141,3 ms** | 461,5 ms | 3,3 vezes menor |
| Erros | 0% | 0% | |

Medido em outubro de 2026 no computador do autor, com Windows e Docker. A API, o banco, o Redis e o k6 rodaram na mesma máquina. Os números mudam de um computador para outro; o que vale é a comparação entre as duas colunas.

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
| GET | `/health` | Confere a API, o banco e o Redis, e mostra se o cache está ligado |

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
├── web/                    vitrine em Next.js
│   ├── src/app/            páginas: início, loja, produto, carrinho e painel do lojista
│   ├── src/proxy.ts        "porteiro" do painel: sem login, vai para a tela de entrada
│   ├── src/components/     partes da tela (tema da loja, produto, carrinho...)
│   ├── src/lib/            regras do carrinho, das opções e do pedido (com testes)
│   └── Dockerfile          receita da imagem da vitrine
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
├── load-test/              teste de carga (k6) e resultados
├── .github/workflows/      verificação automática (GitHub Actions)
├── docker-compose.yml      sobe vitrine, API, PostgreSQL e Redis juntos
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
- **Vitrine com Next.js e streaming.** As páginas são montadas no servidor (Server Components), que busca os dados na API. Um "esqueleto" da página chega na hora, e o conteúdo da loja entra assim que a API responde (Suspense). O Google lê a loja inteira, o que ajuda o comércio a ser encontrado.
- **Um código, vários visuais.** O tema que vem da API vira variáveis CSS, e o Tailwind usa essas variáveis (`bg-primary`, `font-heading`...). As três lojas usam as mesmas telas. O tema fica num layout que não sai da tela ao navegar, então a cor da loja não "pisca" entre uma página e outra.
- **A tela muda com o tipo de loja.** A lanchonete mostra o cardápio em lista, como os apps de comida; as outras lojas usam grade de fotos. Tamanho, cor e peso viram botões, e os adicionais respeitam o mínimo e o máximo de cada grupo.
- **Carrinho no navegador.** Fica salvo no `localStorage`, um por loja: continua lá se o cliente fechar a página, sem precisar de login.
- **O preço do carrinho é só uma prévia.** A vitrine manda para a API apenas o que o cliente escolheu; o total de verdade a API calcula com os preços do banco.
- **O pedido vai direto do navegador para a API.** Assim o limite de tentativas enxerga o IP de cada cliente, e não o do servidor da vitrine.
- **Login do painel num cookie protegido.** O token fica num cookie `httpOnly` (o JavaScript da página não consegue ler), `SameSite=Lax`, válido só nas páginas `/painel` e enviado só por HTTPS em produção. Um script malicioso na página não rouba o login, como aconteceria com o `localStorage`.
- **O login também vai direto do navegador para a API.** Assim o limite de tentativas conta o IP de cada pessoa. Depois, uma Server Action confere o token na API e o guarda no cookie. *Se o login passasse pelo servidor da vitrine, todo mundo apareceria com o mesmo IP e dividiria o mesmo limite.*
- **Duas checagens no painel.** O `proxy.ts` do Next.js olha o cookie antes da página (sem login ou com o login vencido, vai para a tela de entrada). Mas quem decide de verdade é a API, que confere a assinatura do token em cada pedido de dados. Os botões de situação seguem a mesma regra da API, que confere de novo.
- **Pedido novo aparece sozinho.** A lista de pedidos se atualiza a cada 15 segundos, só com a aba aberta na tela, para não gastar a API à toa. *Com muitos lojistas, o próximo passo seria avisar em tempo real (WebSocket ou Server-Sent Events).*
- **Server Actions no painel.** Os formulários chamam funções que rodam no servidor da vitrine. Cada uma confere de novo tudo o que veio do navegador (formato, tamanho, regras de mínimo e máximo dos adicionais), usando as mesmas funções da tela, e só então chama a API, que confere mais uma vez. O Next.js ainda confere a origem de cada chamada (proteção contra CSRF).
- **Mudou no painel, mudou na loja.** Toda alteração de produto ou categoria passa pelo interceptor que apaga o cache da vitrine na API. Testado: pausar um produto tira ele da loja na mesma hora.
- **Busca do painel sem acento.** "racao" acha "Ração", porque a busca tira os acentos antes de comparar.
- **Horário no fuso de Brasília.** O servidor roda em UTC; o painel mostra os horários fixando o fuso `America/Sao_Paulo`.
- **Demonstração honesta.** Nas lojas de demonstração, a vitrine avisa no topo que os pedidos são simulados e mostra a mensagem do WhatsApp numa simulação, sem enviar nada.
- **Acessível e legível.** Botões, rótulos e campos de verdade (dá para usar pelo teclado), e contraste conferido: cores que não passavam (texto branco no verde, dourado em texto pequeno) ganharam versões mais escuras no tema.
- **Fontes guardadas no projeto.** As fontes vêm do Fontsource (npm), sem depender do Google na hora de montar ou abrir o site.
- **CI com banco e Redis de verdade.** Teste com dados simulados não pega erro de SQL nem de transação. Por isso o GitHub Actions liga um PostgreSQL e um Redis a cada push, roda os testes de integração e ainda sobe a plataforma inteira pelo Docker Compose para conferir o `/health`.
- **Cache da vitrine com versão por loja.** A vitrine é muito lida e pouco alterada, então as respostas ficam no Redis por 10 minutos. Cada loja tem uma "versão" do catálogo, e as respostas são guardadas junto com ela. Quando o lojista muda algo no painel, ou um pedido baixa o estoque, a loja ganha uma versão nova e a vitrine mostra a mudança na hora. Uma resposta antiga que chegue atrasada fica presa à versão velha e nunca é lida. No [teste de carga](#teste-de-carga), o cache fez a API responder 3,7 vezes mais requisições por segundo.
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
- [x] **Etapa 3:** desempenho e automação
  - [x] cache da vitrine e limite de tentativas com Redis
  - [x] testes automáticos no GitHub Actions
  - [x] teste de carga com k6
- [ ] **Etapa 4:** parte visual
  - [x] vitrine: lojas, produto, carrinho e pedido pelo WhatsApp
  - [x] painel do lojista: entrada e pedidos
  - [x] painel do lojista: produtos, categorias e restaurar a demonstração
  - [x] fotos dos produtos e página inicial nova
  - [ ] acabamento: "experimentar outro estilo", QR Code e PWA
- [ ] **Etapa 5:** publicação (Render, Neon e Vercel)

## Autor

**Fernando Pablo**, da [Lychnos Tech](https://lychnos-portfolio.vercel.app)
[LinkedIn](https://www.linkedin.com/in/fernandopablogomes) · [GitHub](https://github.com/fernando-pablo)
