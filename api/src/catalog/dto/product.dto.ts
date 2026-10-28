/**
 * Formato dos produtos que a API entrega para a vitrine.
 * Preços sempre em centavos: 1990 = R$ 19,90.
 * O estoque exato não é mostrado ao público, só "disponível" e "últimas unidades".
 */

export class ProductCategoryDto {
  id: string;
  name: string;
}

/** Produto na lista do catálogo. */
export class ProductSummaryDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: ProductCategoryDto | null;
  isFeatured: boolean;
  /** Menor preço possível (para mostrar "a partir de") */
  minPriceCents: number;
  /** Maior preço possível. Igual ao menor quando o preço é único */
  maxPriceCents: number;
  /** O cliente precisa escolher entre variações (tamanho, cor, peso...) */
  hasVariants: boolean;
  /** Existe pelo menos uma opção com estoque */
  available: boolean;
}

/** Versão do produto: "M / Azul", "15 kg", "220 V". */
export class VariantDto {
  id: string;
  name: string;
  /** Ex.: { "tamanho": "M", "cor": "Azul" } */
  attributes: Record<string, string>;
  priceCents: number;
  available: boolean;
  /** Restam poucas unidades */
  lowStock: boolean;
}

export class AddonDto {
  id: string;
  name: string;
  priceCents: number;
}

/** Grupo de adicionais. minSelect 1 = obrigatório; maxSelect 1 = escolha única. */
export class AddonGroupDto {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  addons: AddonDto[];
}

/** Produto completo, para a página do produto. */
export class ProductDetailDto extends ProductSummaryDto {
  variants: VariantDto[];
  addonGroups: AddonGroupDto[];
}
