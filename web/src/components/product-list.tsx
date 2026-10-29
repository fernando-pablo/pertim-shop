import Link from 'next/link';
import { formatPriceRange } from '@/lib/money';
import type { ProductSummary, Segment } from '@/lib/types';
import { Photo } from './store-theme';

interface ListProps {
  slug: string;
  segment: Segment;
  products: ProductSummary[];
}

const productHref = (slug: string, id: string) => `/${slug}/produto/${id}`;

function SoldOut() {
  return (
    <span className="w-fit rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-bg">
      Esgotado
    </span>
  );
}

/**
 * Lanchonete mostra o cardápio em lista (nome, descrição e foto ao lado),
 * como os apps de comida. As outras lojas usam grade de fotos.
 */
export function ProductList(props: ListProps) {
  return props.segment === 'SNACK_BAR' ? (
    <ProductRows {...props} />
  ) : (
    <ProductGrid {...props} />
  );
}

function ProductGrid({ slug, segment, products }: ListProps) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <Link
            href={productHref(slug, product.id)}
            className="flex flex-col gap-1.5 text-ink no-underline"
          >
            <Photo
              src={product.imageUrl}
              alt={product.name}
              segment={segment}
              className="aspect-[4/5] rounded-store"
            />
            <span className="leading-snug font-semibold">{product.name}</span>
            {product.available ? (
              <span className="text-sm font-bold text-primary">
                {formatPriceRange(product.minPriceCents, product.maxPriceCents)}
              </span>
            ) : (
              <SoldOut />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProductRows({ slug, segment, products }: ListProps) {
  return (
    <ul className="flex flex-col">
      {products.map((product) => (
        <li key={product.id} className="border-b border-line last:border-b-0">
          <Link
            href={productHref(slug, product.id)}
            className="flex gap-4 py-4 text-ink no-underline"
          >
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-bold">{product.name}</span>
              {product.description && (
                <span className="line-clamp-2 text-sm text-muted">
                  {product.description}
                </span>
              )}
              {product.available ? (
                <span className="font-bold text-primary">
                  {formatPriceRange(
                    product.minPriceCents,
                    product.maxPriceCents,
                  )}
                </span>
              ) : (
                <SoldOut />
              )}
            </div>
            <Photo
              src={product.imageUrl}
              alt={product.name}
              segment={segment}
              iconSize={26}
              sizes="96px"
              className="size-24 shrink-0 rounded-store"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Destaques da loja numa faixa que rola para o lado. */
export function FeaturedStrip({ slug, segment, products }: ListProps) {
  return (
    <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2">
      {products.map((product) => (
        <li key={product.id} className="w-40 shrink-0 snap-start sm:w-48">
          <Link
            href={productHref(slug, product.id)}
            className="flex flex-col gap-1.5 text-ink no-underline"
          >
            <Photo
              src={product.imageUrl}
              alt={product.name}
              segment={segment}
              className="aspect-square rounded-store"
            />
            <span className="text-sm leading-snug font-semibold">
              {product.name}
            </span>
            <span className="text-sm font-bold text-primary">
              {formatPriceRange(product.minPriceCents, product.maxPriceCents)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
