import { ProductCategoryDto } from '../../catalog/dto/product.dto';

/**
 * Produto como o lojista vê no painel: com estoque exato, preços de cada
 * variação e itens desativados.
 */
export class PanelVariantDto {
  id: string;
  name: string;
  attributes: Record<string, string>;
  /** Vazio = usa o preço do produto */
  priceCents: number | null;
  /** Vazio = não controla estoque */
  stock: number | null;
  isActive: boolean;
  position: number;
}

export class PanelAddonDto {
  id: string;
  name: string;
  priceCents: number;
  isActive: boolean;
}

export class PanelAddonGroupDto {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  addons: PanelAddonDto[];
}

export class PanelProductDto {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  position: number;
  category: ProductCategoryDto | null;
  variants: PanelVariantDto[];
  addonGroups: PanelAddonGroupDto[];
  updatedAt: Date;
}
