import Image from 'next/image';
import type { ReactNode } from 'react';
import { initials, themeStyle } from '@/lib/theme';
import type { Segment, StoreSummary } from '@/lib/types';
import { SegmentIcon } from './icons';

/** Aplica o visual da loja (cores, fontes e cantos) em tudo o que está dentro. */
export function StoreTheme({
  store,
  children,
  className = 'min-h-dvh bg-bg',
}: {
  store: StoreSummary;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      style={themeStyle(store.theme)}
      className={`font-body text-ink ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Logo da loja; sem logo, monta um com as iniciais nas cores da loja.
 * `square` deixa os cantos retos (cartões da página inicial).
 */
export function StoreLogo({
  store,
  size = 40,
  square = false,
}: {
  store: StoreSummary;
  size?: number;
  square?: boolean;
}) {
  const style = { width: size, height: size };
  const corners = square ? '' : 'rounded-store';
  if (store.theme.logoUrl) {
    return (
      <Image
        src={store.theme.logoUrl}
        alt=""
        width={size}
        height={size}
        className={`object-cover ${corners}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ ...style, fontSize: size * 0.42 }}
      className={`flex shrink-0 items-center justify-center bg-primary font-heading font-semibold tracking-wide text-on-primary ${corners}`}
    >
      {initials(store.name)}
    </span>
  );
}

/**
 * Foto do produto; sem foto, mostra um desenho do tipo de loja. O desenho é
 * só decoração: o nome do produto já está escrito ao lado.
 */
export function Photo({
  src,
  alt,
  segment,
  iconSize = 32,
  sizes = '50vw',
  className = '',
}: {
  src: string | null | undefined;
  alt: string;
  segment: Segment;
  iconSize?: number;
  sizes?: string;
  className?: string;
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-soft ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center bg-soft text-primary ${className}`}
    >
      <SegmentIcon segment={segment} size={iconSize} strokeWidth={1.4} />
    </div>
  );
}
