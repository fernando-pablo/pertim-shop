import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { searchWords } from './search-words';

/** Semelhança mínima (0 a 1) para um produto contar como "parecido". */
const MIN_SIMILARITY = 0.3;
/** Só mostra os parecidos que chegam perto do melhor resultado. */
const SIMILARITY_MARGIN = 0.2;

export interface SearchHits {
  /** exact: achou as palavras; similar: só parecidos (erro de digitação) */
  match: 'exact' | 'similar' | 'none';
  /** Ids dos produtos, já na ordem de importância */
  ids: string[];
}

/** Texto sem acento e em minúsculas, como a busca compara. */
const plain = (sql: Prisma.Sql) => Prisma.sql`unaccent(lower(${sql}))`;

/**
 * Busca da vitrine, feita no PostgreSQL:
 * 1. ignora acentos e maiúsculas (extensão unaccent);
 * 2. cada palavra precisa aparecer no nome, na descrição ou na categoria,
 *    em qualquer ordem, e pedaço de palavra vale ("ra" acha "Ração");
 * 3. se nada aparecer, procura nomes parecidos (extensão pg_trgm), para
 *    perdoar erros pequenos de digitação ("rasao" acha "Ração").
 * Todos os valores vão como parâmetros da consulta, nunca colados no SQL.
 */
@Injectable()
export class ProductSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(storeId: string, text: string): Promise<SearchHits> {
    const words = searchWords(text);
    if (words.length === 0) return { match: 'none', ids: [] };

    const exact = await this.findExact(storeId, words);
    if (exact.length > 0) return { match: 'exact', ids: exact };

    const phrase = words.join(' ');
    if (phrase.length < 3) return { match: 'none', ids: [] };
    const similar = await this.findSimilar(storeId, phrase);
    return similar.length > 0
      ? { match: 'similar', ids: similar }
      : { match: 'none', ids: [] };
  }

  /**
   * Todas as palavras precisam aparecer. Ordem: nome que começa com a
   * primeira palavra, depois nome com todas as palavras, depois o resto
   * (achado na descrição ou na categoria).
   */
  async findExact(storeId: string, words: string[]): Promise<string[]> {
    const name = plain(Prisma.sql`p.name`);
    const everything = plain(
      Prisma.sql`p.name || ' ' || coalesce(p.description, '') || ' ' || coalesce(c.name, '')`,
    );
    const contains = (target: Prisma.Sql) =>
      Prisma.join(
        words.map((word) => Prisma.sql`${target} LIKE ${`%${word}%`}`),
        ' AND ',
      );

    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT p.id
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.store_id = ${storeId}::uuid
        AND p.is_active = true
        AND ${contains(everything)}
      ORDER BY
        CASE
          WHEN ${name} LIKE ${`${words[0]}%`} THEN 0
          WHEN ${contains(name)} THEN 1
          ELSE 2
        END,
        p.position,
        p.name
      LIMIT 50`;
    return rows.map((row) => row.id);
  }

  /** Nomes parecidos com o que a pessoa digitou, do mais parecido ao menos. */
  async findSimilar(storeId: string, phrase: string): Promise<string[]> {
    const score = Prisma.sql`word_similarity(${phrase}, ${plain(Prisma.sql`p.name`)})`;
    const rows = await this.prisma.$queryRaw<{ id: string; score: number }[]>`
      SELECT p.id, ${score}::float AS score
      FROM products p
      WHERE p.store_id = ${storeId}::uuid
        AND p.is_active = true
        AND ${score} >= ${MIN_SIMILARITY}::float
      ORDER BY score DESC, p.position, p.name
      LIMIT 10`;
    const best = rows[0]?.score ?? 0;
    return rows
      .filter((row) => row.score >= best - SIMILARITY_MARGIN)
      .map((row) => row.id);
  }
}
