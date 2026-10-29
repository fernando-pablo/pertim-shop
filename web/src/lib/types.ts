/**
 * Formato dos dados que a API devolve (o mesmo do Swagger, em /docs).
 * Preços sempre em centavos: 1990 = R$ 19,90.
 */

export type Segment =
  'CLOTHING' | 'SNACK_BAR' | 'PET_SHOP' | 'FURNITURE_ELECTRONICS' | 'VARIETY';

export interface StoreTheme {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    primary: string;
    primaryText: string;
    accent: string;
    accentText?: string;
    soft?: string;
  };
  fonts: { heading: string; body: string };
  radius: number;
  logoUrl?: string | null;
  coverUrl?: string | null;
}

export interface StoreSummary {
  slug: string;
  name: string;
  segment: Segment;
  description: string | null;
  theme: StoreTheme;
}

export interface Store extends StoreSummary {
  whatsapp: string;
  isDemo: boolean;
}

export interface Category {
  id: string;
  name: string;
  productCount: number;
}

export interface ProductSummary {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: { id: string; name: string } | null;
  isFeatured: boolean;
  minPriceCents: number;
  maxPriceCents: number;
  hasVariants: boolean;
  available: boolean;
}

export interface Variant {
  id: string;
  name: string;
  attributes: Record<string, string>;
  priceCents: number;
  available: boolean;
  lowStock: boolean;
}

export interface Addon {
  id: string;
  name: string;
  priceCents: number;
}

export interface AddonGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  addons: Addon[];
}

export interface ProductDetail extends ProductSummary {
  variants: Variant[];
  addonGroups: AddonGroup[];
}

export type Fulfillment = 'PICKUP' | 'DELIVERY';

export interface OrderCreated {
  order: {
    id: string;
    number: number;
    totalCents: number;
    fulfillment: Fulfillment;
  };
  whatsapp: { phone: string; message: string; url: string };
  isDemo: boolean;
}
