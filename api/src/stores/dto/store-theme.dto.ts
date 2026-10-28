import { ApiProperty } from '@nestjs/swagger';

/**
 * Visual de uma loja. Fica salvo no banco (coluna "theme"), então mudar o
 * visual de uma loja ou criar uma loja nova não exige programar nada.
 */
export class StoreThemeColors {
  /** Fundo da página. Ex.: #FAF7F2 */
  background: string;
  /** Fundo de cards e caixas */
  surface: string;
  /** Texto principal */
  text: string;
  /** Texto secundário */
  muted: string;
  /** Cor dos botões principais */
  primary: string;
  /** Texto em cima da cor principal */
  primaryText: string;
  /** Cor de destaque (preços, selos) */
  accent: string;
}

export class StoreThemeFonts {
  /** Fonte dos títulos (Google Fonts). Ex.: Cormorant Garamond */
  heading: string;
  /** Fonte dos textos (Google Fonts). Ex.: Inter */
  body: string;
}

export class StoreTheme {
  @ApiProperty({ enum: ['light', 'dark'] })
  mode: 'light' | 'dark';
  colors: StoreThemeColors;
  fonts: StoreThemeFonts;
  /** Arredondamento dos cantos, em pixels */
  radius: number;
  /** Caminho do logo na vitrine */
  logoUrl?: string | null;
  /** Caminho da imagem de capa na vitrine */
  coverUrl?: string | null;
}
