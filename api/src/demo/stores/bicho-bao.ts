import { Segment } from '../../generated/prisma/enums';
import { sizesAndColors, singleVariant, variantsOf } from '../demo-helpers';
import { DemoStore } from '../demo-types';

/** Ração em pacotes de pesos diferentes, cada um com preço e estoque. */
function packs(options: [string, number, number][]) {
  return options.map(([weight, priceCents, stock]) => ({
    name: weight,
    attributes: { peso: weight },
    priceCents,
    stock,
  }));
}

/** Pet shop: visual claro e alegre (verde e amarelo). Proposta inicial. */
export const bichoBao: DemoStore = {
  slug: 'bicho-bao',
  name: 'Bicho Bão Pet Shop',
  segment: Segment.PET_SHOP,
  description:
    'Tudo para o seu bichinho: ração, petiscos, brinquedos e higiene, com entrega rapidinha.',
  whatsapp: '5500000000003',
  theme: {
    mode: 'light',
    colors: {
      background: '#F4FBF8',
      surface: '#FFFFFF',
      text: '#17312B',
      muted: '#5D7A72',
      primary: '#1FA37A',
      primaryText: '#FFFFFF',
      accent: '#FFB547',
    },
    fonts: { heading: 'Fredoka', body: 'Nunito' },
    radius: 18,
    logoUrl: '/demo/bicho-bao/logo.svg',
    coverUrl: '/demo/bicho-bao/capa.webp',
  },
  merchant: {
    name: 'Lojista Bicho Bão',
    email: 'lojista@bicho-bao.pertim.example',
  },
  categories: ['Rações', 'Petiscos', 'Brinquedos', 'Higiene', 'Acessórios'],
  products: [
    {
      name: 'Ração Premium Cães Adultos',
      description:
        'Ração completa para cães adultos de todos os portes, com frango e arroz.',
      priceCents: 3490,
      category: 'Rações',
      featured: true,
      variants: packs([
        ['1 kg', 3490, 12],
        ['3 kg', 8990, 8],
        ['15 kg', 32990, 3],
      ]),
    },
    {
      name: 'Ração Premium Gatos Castrados',
      description: 'Controle de peso e saúde urinária para gatos castrados.',
      priceCents: 3990,
      category: 'Rações',
      variants: packs([
        ['1 kg', 3990, 10],
        ['3 kg', 10490, 5],
        ['10 kg', 28990, 2],
      ]),
    },
    {
      name: 'Ração Filhotes',
      description: 'Grãos menores e mais proteína para a fase de crescimento.',
      priceCents: 3790,
      category: 'Rações',
      variants: packs([
        ['1 kg', 3790, 7],
        ['3 kg', 9890, 0],
      ]),
    },
    {
      name: 'Bifinho de Frango 60 g',
      description: 'Petisco macio sabor frango, ótimo para recompensas.',
      priceCents: 1490,
      category: 'Petiscos',
      variants: singleVariant(30),
    },
    {
      name: 'Osso Natural Bovino',
      description: 'Osso defumado que ajuda na limpeza dos dentes.',
      priceCents: 1990,
      category: 'Petiscos',
      variants: singleVariant(15),
    },
    {
      name: 'Bolinha com Guizo',
      description:
        'Bolinha de borracha resistente, com guizo para chamar a atenção.',
      priceCents: 1290,
      category: 'Brinquedos',
      variants: variantsOf('cor', ['Azul', 'Vermelha', 'Amarela'], [8, 6, 0]),
    },
    {
      name: 'Mordedor de Corda',
      description: 'Corda de algodão trançada para brincar de cabo de guerra.',
      priceCents: 2490,
      category: 'Brinquedos',
      variants: variantsOf('tamanho', ['P', 'M', 'G'], [5, 4, 3]),
    },
    {
      name: 'Arranhador para Gatos',
      description: 'Arranhador de sisal com base firme e bolinha pendurada.',
      priceCents: 11990,
      category: 'Brinquedos',
      variants: singleVariant(2),
    },
    {
      name: 'Shampoo Neutro 500 ml',
      description: 'Para cães e gatos de pele sensível. Não arde os olhos.',
      priceCents: 2990,
      category: 'Higiene',
      variants: singleVariant(9),
    },
    {
      name: 'Tapete Higiênico 30 unidades',
      description: 'Absorção rápida e camada que evita vazamentos.',
      priceCents: 6990,
      category: 'Higiene',
      featured: true,
      variants: singleVariant(6),
    },
    {
      name: 'Coleira Ajustável',
      description:
        'Coleira de nylon com fecho de segurança e argola para guia.',
      priceCents: 3990,
      category: 'Acessórios',
      variants: sizesAndColors(
        ['P', 'M', 'G'],
        ['Vermelha', 'Azul'],
        [4, 3, 5, 2, 1, 3],
      ),
    },
    {
      name: 'Caminha Retangular',
      description: 'Caminha acolchoada com capa removível e lavável.',
      priceCents: 14990,
      category: 'Acessórios',
      variants: variantsOf('tamanho', ['P', 'M', 'G'], [2, 3, 1]),
    },
  ],
};
