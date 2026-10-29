import type { CSSProperties } from 'react';
import type { Segment, StoreTheme } from './types';

/**
 * Fontes que a vitrine já tem (instaladas pelo Fontsource, sem depender do
 * Google). O tema da loja escolhe pelo nome; nome desconhecido usa a padrão.
 */
const FONT_STACKS: Record<string, string> = {
  'Cormorant Garamond': "'Cormorant Garamond Variable', Georgia, serif",
  Inter: "'Inter Variable', system-ui, sans-serif",
  'Bebas Neue': "'Bebas Neue', Impact, sans-serif",
  Manrope: "'Manrope Variable', system-ui, sans-serif",
  'Baloo 2': "'Baloo 2 Variable', system-ui, sans-serif",
  Nunito: "'Nunito Variable', system-ui, sans-serif",
};

const DEFAULT_FONT = FONT_STACKS.Manrope;

/** Cores da marca Pertim Shop (página inicial e lojas sem tema). */
export const PERTIM_COLORS = {
  background: '#FAF6EF',
  surface: '#FFFFFF',
  text: '#1F1A14',
  muted: '#6B6258',
  primary: '#B4540F',
  primaryText: '#FFFFFF',
  accent: '#F2B705',
  accentText: '#8A4A0E',
};

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Só aceita cores no formato #RGB ou #RRGGBB; o resto vira a cor padrão. */
export function safeColor(value: string | undefined, fallback: string) {
  return value && HEX_COLOR.test(value) ? value : fallback;
}

/** Texto escuro ou claro, o que tiver mais contraste com a cor de fundo. */
export function readableOn(background: string): string {
  const hex =
    background.length === 4
      ? background
          .slice(1)
          .split('')
          .map((c) => c + c)
          .join('')
      : background.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.18 ? '#1A1A1A' : '#FFFFFF';
}

export function fontStack(name: string | undefined): string {
  return (name && FONT_STACKS[name]) || DEFAULT_FONT;
}

/**
 * Transforma o tema da loja (que vem da API) em variáveis CSS. O Tailwind
 * usa essas variáveis (bg-bg, text-ink, bg-primary...), então a mesma tela
 * ganha o visual de cada loja sem mudar o código.
 */
export function themeStyle(theme: StoreTheme): CSSProperties {
  const colors = theme.colors;
  const pick = (key: keyof typeof PERTIM_COLORS) =>
    safeColor(colors[key], PERTIM_COLORS[key]);
  const accent = pick('accent');
  const radius = Math.min(Math.max(Number(theme.radius) || 0, 0), 32);

  return {
    '--store-bg': pick('background'),
    '--store-surface': pick('surface'),
    '--store-text': pick('text'),
    '--store-muted': pick('muted'),
    '--store-primary': pick('primary'),
    '--store-on-primary': pick('primaryText'),
    '--store-accent': accent,
    '--store-accent-text': safeColor(colors.accentText, accent),
    '--store-on-accent': readableOn(accent),
    ...(colors.soft &&
      HEX_COLOR.test(colors.soft) && { '--store-soft': colors.soft }),
    '--store-radius': `${radius}px`,
    '--store-font-heading': fontStack(theme.fonts?.heading),
    '--store-font-body': fontStack(theme.fonts?.body),
    colorScheme: theme.mode === 'dark' ? 'dark' : 'light',
  } as CSSProperties;
}

/** Iniciais para o logo: "Moda Chic" -> "MC", "Fome-Sô" -> "FS". */
export function initials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export const SEGMENT_LABELS: Record<Segment, string> = {
  CLOTHING: 'Moda',
  SNACK_BAR: 'Lanchonete',
  PET_SHOP: 'Pet shop',
  FURNITURE_ELECTRONICS: 'Móveis e eletrônicos',
  VARIETY: 'Variedades',
};
