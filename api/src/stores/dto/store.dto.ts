import { ApiProperty } from '@nestjs/swagger';
import { Segment } from '../../generated/prisma/enums';
import { StoreTheme } from './store-theme.dto';

/** Loja na lista ("vitrine de lojas" da plataforma). */
export class StoreSummaryDto {
  /** Endereço da loja. Ex.: moda-chic */
  slug: string;
  name: string;
  @ApiProperty({ enum: Object.values(Segment) })
  segment: Segment;
  description: string | null;
  theme: StoreTheme;
}

/** Dados completos de uma loja, usados pela vitrine. */
export class StoreDto extends StoreSummaryDto {
  /** Número do WhatsApp que recebe os pedidos (só dígitos, com DDI) */
  whatsapp: string;
  /** Loja de demonstração: os pedidos são simulados */
  isDemo: boolean;
}
