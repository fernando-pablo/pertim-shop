import { Segment } from '../../generated/prisma/enums';
import { sizesAndColors, singleVariant, variantsOf } from '../demo-helpers';
import { DemoStore } from '../demo-types';

/** Loja de roupas: visual claro e sofisticado (creme, preto e dourado). */
export const modaChic: DemoStore = {
  slug: 'moda-chic',
  name: 'Moda Chic',
  segment: Segment.CLOTHING,
  description:
    'Moda feminina com peças atemporais, tecidos naturais e caimento impecável.',
  whatsapp: '5500000000001',
  theme: {
    mode: 'light',
    colors: {
      background: '#FAF7F2',
      surface: '#FFFFFF',
      text: '#1A1A1A',
      muted: '#6F6A63',
      primary: '#1A1A1A',
      primaryText: '#FAF7F2',
      accent: '#B8925A',
      // Dourado mais escuro para textos pequenos (contraste de 4,7 com o creme).
      accentText: '#8A6A3B',
      soft: '#EFE7DA',
    },
    fonts: { heading: 'Cormorant Garamond', body: 'Inter' },
    radius: 2,
    logoUrl: null,
    coverUrl: null,
  },
  merchant: {
    name: 'Lojista Moda Chic',
    email: 'lojista@moda-chic.pertim.example',
  },
  categories: ['Vestidos', 'Blusas e camisas', 'Calças e saias', 'Acessórios'],
  products: [
    {
      name: 'Vestido Midi de Linho',
      description:
        'Vestido midi em linho com botões frontais e cinto do mesmo tecido. Fresco e elegante para o dia a dia.',
      priceCents: 18990,
      category: 'Vestidos',
      featured: true,
      variants: sizesAndColors(
        ['P', 'M', 'G'],
        ['Areia', 'Preto'],
        [4, 6, 2, 5, 3, 0],
      ),
    },
    {
      name: 'Vestido Envelope Floral',
      description:
        'Modelagem envelope que valoriza a cintura, em viscose leve com estampa floral.',
      priceCents: 15990,
      category: 'Vestidos',
      variants: variantsOf('tamanho', ['P', 'M', 'G', 'GG'], [3, 5, 2, 0]),
    },
    {
      name: 'Vestido Tubinho Preto',
      description:
        'O clássico que resolve qualquer ocasião. Malha com elastano, caimento justo e confortável.',
      priceCents: 13990,
      category: 'Vestidos',
      variants: variantsOf('tamanho', ['P', 'M', 'G'], [5, 4, 1]),
    },
    {
      name: 'Blusa de Seda Off-White',
      description: 'Blusa fluida com toque de seda, decote V e mangas soltas.',
      priceCents: 11990,
      category: 'Blusas e camisas',
      featured: true,
      variants: variantsOf('tamanho', ['P', 'M', 'G'], [6, 3, 4]),
    },
    {
      name: 'Camisa Social Feminina',
      description:
        'Camisa de algodão com modelagem ajustada, perfeita para o trabalho.',
      priceCents: 9990,
      category: 'Blusas e camisas',
      variants: sizesAndColors(
        ['P', 'M', 'G'],
        ['Branca', 'Azul-claro'],
        [5, 2, 4, 3, 0, 2],
      ),
    },
    {
      name: 'Body Canelado',
      description: 'Body canelado de alcinha, base perfeita para composições.',
      priceCents: 6990,
      category: 'Blusas e camisas',
      variants: sizesAndColors(
        ['P', 'M', 'G'],
        ['Preto', 'Caramelo'],
        [7, 4, 6, 5, 2, 3],
      ),
    },
    {
      name: 'Calça Pantalona de Alfaiataria',
      description:
        'Cintura alta, pernas amplas e tecido com caimento fluido. Alonga a silhueta.',
      priceCents: 16990,
      category: 'Calças e saias',
      featured: true,
      variants: sizesAndColors(
        ['36', '38', '40', '42'],
        ['Preta', 'Bege'],
        [3, 2, 5, 4, 4, 1, 2, 0],
      ),
    },
    {
      name: 'Calça Jeans Reta',
      description: 'Jeans de lavagem média, cintura alta e modelagem reta.',
      priceCents: 14990,
      category: 'Calças e saias',
      variants: variantsOf(
        'tamanho',
        ['36', '38', '40', '42', '44'],
        [2, 6, 5, 3, 1],
      ),
    },
    {
      name: 'Saia Plissada Midi',
      description:
        'Saia plissada com cós de elástico e movimento leve ao caminhar.',
      priceCents: 12990,
      category: 'Calças e saias',
      variants: sizesAndColors(
        ['P', 'M', 'G'],
        ['Verde-oliva', 'Champanhe'],
        [3, 4, 2, 5, 1, 2],
      ),
    },
    {
      name: 'Bolsa Tiracolo de Couro',
      description: 'Bolsa de couro com alça regulável e fecho dourado.',
      priceCents: 21990,
      category: 'Acessórios',
      variants: variantsOf('cor', ['Caramelo', 'Preta'], [3, 5]),
    },
    {
      name: 'Cinto com Fivela Dourada',
      description: 'Cinto de couro com fivela dourada, para marcar a cintura.',
      priceCents: 6990,
      category: 'Acessórios',
      variants: variantsOf('tamanho', ['P/M', 'G/GG'], [8, 4]),
    },
    {
      name: 'Brinco Argola Dourada',
      description: 'Argola média banhada a ouro, leve e antialérgica.',
      priceCents: 4990,
      category: 'Acessórios',
      variants: singleVariant(10, 'Tamanho único'),
    },
  ],
};
