// Teste de carga da vitrine, com o k6 (https://k6.io).
//
// Simula 50 clientes navegando nas lojas ao mesmo tempo, por 30 segundos.
// Cada cliente abre uma loja, as categorias, a lista de produtos e um
// produto, e repete sem parar. No fim, mostra quantas respostas por segundo
// a API deu e quanto tempo elas levaram.
//
// Como rodar (com o Docker ligado): docker compose run --rm --no-deps k6
// O resultado também é salvo em load-test/results/com-cache.json (ou
// sem-cache.json, se a API estiver com CACHE_ENABLED=false).

import http from 'k6/http';
import { check, fail } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';
const RESULTS_DIR = __ENV.RESULTS_DIR || 'load-test/results';
const STORES = ['moda-chic', 'fome-so', 'bicho-bao'];

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    // O teste falha se mais de 1% das respostas derem erro.
    http_req_failed: ['rate<0.01'],
  },
};

// Roda uma vez antes do teste: confere a API e pega os produtos das lojas.
export function setup() {
  const health = http.get(`${BASE_URL}/health`);
  if (health.status !== 200) {
    fail(`A API não está saudável (${health.status}). Ela está ligada?`);
  }

  const products = {};
  for (const slug of STORES) {
    const response = http.get(`${BASE_URL}/stores/${slug}/products`);
    if (response.status !== 200) {
      fail(`A loja ${slug} não respondeu (${response.status}).`);
    }
    products[slug] = response.json().map((product) => product.id);
  }

  const cacheOn = health.json().cache !== 'off';
  return { products, scenario: cacheOn ? 'com-cache' : 'sem-cache' };
}

// O que cada cliente virtual faz, sem parar, até o tempo acabar.
export default function ({ products }) {
  const slug = pick(STORES);
  const pages = {
    loja: `/stores/${slug}`,
    categorias: `/stores/${slug}/categories`,
    produtos: `/stores/${slug}/products`,
    produto: `/stores/${slug}/products/${pick(products[slug])}`,
  };

  for (const [name, path] of Object.entries(pages)) {
    const response = http.get(`${BASE_URL}${path}`, { tags: { name } });
    check(response, { 'respondeu 200': (r) => r.status === 200 });
  }
}

// Resumo curto no fim, mais um arquivo .json com os números.
export function handleSummary(data) {
  const scenario = data.setup_data?.scenario ?? 'teste';
  const metrics = data.metrics;
  const result = {
    cenario: scenario,
    data: new Date().toISOString(),
    clientesSimultaneos: metrics.vus_max.values.max,
    duracaoSegundos: Math.round(data.state.testRunDurationMs / 1000),
    requisicoes: metrics.http_reqs.values.count,
    requisicoesPorSegundo: round(metrics.http_reqs.values.rate),
    tempoMedioMs: round(metrics.http_req_duration.values.avg),
    tempoP95Ms: round(metrics.http_req_duration.values['p(95)']),
    erros: `${round(metrics.http_req_failed.values.rate * 100)}%`,
  };

  const text = [
    '',
    `Resultado: ${scenario} (${result.clientesSimultaneos} clientes por ${result.duracaoSegundos}s)`,
    `  Requisições: ${result.requisicoes}`,
    `  Requisições por segundo: ${result.requisicoesPorSegundo}`,
    `  Tempo médio de resposta: ${result.tempoMedioMs} ms`,
    `  95% responderam em até: ${result.tempoP95Ms} ms`,
    `  Erros: ${result.erros}`,
    '',
  ].join('\n');

  return {
    stdout: text,
    [`${RESULTS_DIR}/${scenario}.json`]: `${JSON.stringify(result, null, 2)}\n`,
  };
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function round(value) {
  return Math.round(value * 10) / 10;
}
