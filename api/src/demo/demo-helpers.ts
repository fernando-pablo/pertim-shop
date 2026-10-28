import { DemoVariant } from './demo-types';

/** "Vestido Midi de Linho" -> "vestido-midi-de-linho" */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Caminho da foto do produto. As fotos ficam na vitrine, não na API. */
export function imagePath(storeSlug: string, productName: string): string {
  return `/demo/${storeSlug}/${slugify(productName)}.webp`;
}

/**
 * Variações de um atributo só. Ex.: tamanhos P, M e G com estoque 3, 5 e 0.
 * `stocks` é usado em sequência; sem `stocks`, não controla estoque.
 */
export function variantsOf(
  attribute: string,
  values: string[],
  stocks?: number[],
): DemoVariant[] {
  return values.map((value, index) => ({
    name: value,
    attributes: { [attribute]: value },
    stock: stocks ? stocks[index % stocks.length] : null,
  }));
}

/** Todas as combinações de tamanho e cor. Ex.: "M / Azul". */
export function sizesAndColors(
  sizes: string[],
  colors: string[],
  stocks: number[],
): DemoVariant[] {
  const variants: DemoVariant[] = [];
  for (const size of sizes) {
    for (const color of colors) {
      variants.push({
        name: `${size} / ${color}`,
        attributes: { tamanho: size, cor: color },
        stock: stocks[variants.length % stocks.length],
      });
    }
  }
  return variants;
}

/** Produto sem escolha, mas com estoque controlado. */
export function singleVariant(stock: number, name = 'Unidade'): DemoVariant[] {
  return [{ name, stock }];
}
