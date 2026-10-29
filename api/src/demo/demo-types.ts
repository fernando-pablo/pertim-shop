import { Segment } from '../generated/prisma/enums';
import { StoreTheme } from '../stores/dto/store-theme.dto';

/** Formato dos dados de exemplo das lojas de demonstração. */

export interface DemoVariant {
  name: string;
  attributes?: Record<string, string>;
  /** Preço próprio da variação, em centavos */
  priceCents?: number;
  /** Estoque. null ou ausente = não controla estoque */
  stock?: number | null;
}

export interface DemoAddonGroup {
  name: string;
  minSelect: number;
  maxSelect: number;
  addons: { name: string; priceCents: number }[];
}

export interface DemoProduct {
  name: string;
  description: string;
  priceCents: number;
  category: string;
  featured?: boolean;
  variants?: DemoVariant[];
  addonGroups?: DemoAddonGroup[];
}

export interface DemoStore {
  slug: string;
  name: string;
  segment: Segment;
  description: string;
  /** Número fictício: na demonstração nada é enviado de verdade */
  whatsapp: string;
  theme: StoreTheme;
  /** As fotos dos produtos já estão na vitrine? (entram na Etapa 4C) */
  photos?: boolean;
  merchant: { name: string; email: string };
  categories: string[];
  products: DemoProduct[];
}
