import { Segment } from '../../generated/prisma/enums';
import { variantsOf } from '../demo-helpers';
import { DemoAddonGroup, DemoStore } from '../demo-types';

/** Escolha obrigatória de 1 opção. */
const meatPoint: DemoAddonGroup = {
  name: 'Ponto da carne',
  minSelect: 1,
  maxSelect: 1,
  addons: [
    { name: 'Mal passada', priceCents: 0 },
    { name: 'Ao ponto', priceCents: 0 },
    { name: 'Bem passada', priceCents: 0 },
  ],
};

/** Até 5 adicionais, todos opcionais. */
const burgerExtras: DemoAddonGroup = {
  name: 'Adicionais',
  minSelect: 0,
  maxSelect: 5,
  addons: [
    { name: 'Bacon', priceCents: 400 },
    { name: 'Queijo extra', priceCents: 300 },
    { name: 'Ovo', priceCents: 250 },
    { name: 'Cebola caramelizada', priceCents: 350 },
    { name: 'Hambúrguer extra', priceCents: 900 },
  ],
};

const sauces: DemoAddonGroup = {
  name: 'Molhos',
  minSelect: 0,
  maxSelect: 2,
  addons: [
    { name: 'Cheddar', priceCents: 400 },
    { name: 'Maionese da casa', priceCents: 300 },
    { name: 'Barbecue', priceCents: 300 },
  ],
};

/** Porção meia ou inteira, com preços diferentes e sem controle de estoque. */
function portionSizes(half: number, full: number) {
  return [
    { name: 'Meia', attributes: { tamanho: 'Meia' }, priceCents: half },
    { name: 'Inteira', attributes: { tamanho: 'Inteira' }, priceCents: full },
  ];
}

/** Lanchonete: visual escuro e quente, valorizando as fotos. */
export const fomeSo: DemoStore = {
  slug: 'fome-so',
  name: 'Fome-Sô',
  segment: Segment.SNACK_BAR,
  description:
    'Lanchonete com sabor de Minas: burgers, porções e doces caseiros, feitos na hora.',
  whatsapp: '5500000000002',
  theme: {
    mode: 'dark',
    colors: {
      background: '#14100D',
      surface: '#1F1915',
      text: '#F6EEE6',
      muted: '#B3A69A',
      primary: '#F28C28',
      primaryText: '#1A0F05',
      accent: '#FFC15E',
    },
    fonts: { heading: 'Bebas Neue', body: 'Manrope' },
    radius: 14,
    logoUrl: null,
    coverUrl: '/demo/fome-so/capa.webp',
  },
  photos: true,
  merchant: {
    name: 'Lojista Fome-Sô',
    email: 'lojista@fome-so.pertim.example',
  },
  categories: ['Lanches', 'Porções', 'Bebidas', 'Sobremesas'],
  products: [
    {
      name: 'Burger Trem Bão',
      description:
        'Pão brioche, hambúrguer artesanal de 160 g, queijo canastra, bacon crocante e maionese da casa.',
      priceCents: 3290,
      category: 'Lanches',
      featured: true,
      addonGroups: [meatPoint, burgerExtras],
    },
    {
      name: 'Burger Sô Simples',
      description:
        'Pão, hambúrguer de 120 g, queijo, alface, tomate e molho especial.',
      priceCents: 2490,
      category: 'Lanches',
      addonGroups: [meatPoint, burgerExtras],
    },
    {
      name: 'Smash Duplo Mineiro',
      description:
        'Dois smash de 90 g, queijo minas derretido, cebola na chapa e maionese de alho.',
      priceCents: 3690,
      category: 'Lanches',
      featured: true,
      addonGroups: [burgerExtras],
    },
    {
      name: 'Burger no Pão de Queijo',
      description:
        'Hambúrguer de 120 g, queijo minas e requeijão cremoso no pão de queijo gigante.',
      priceCents: 2790,
      category: 'Lanches',
      addonGroups: [meatPoint, burgerExtras],
    },
    {
      name: 'Frango Crocante',
      description:
        'Filé de frango empanado, alface, tomate e maionese de ervas.',
      priceCents: 2990,
      category: 'Lanches',
      addonGroups: [burgerExtras],
    },
    {
      name: 'Batata Rústica',
      description: 'Batatas com casca, alecrim e sal grosso.',
      priceCents: 1990,
      category: 'Porções',
      variants: portionSizes(1990, 3290),
      addonGroups: [sauces],
    },
    {
      name: 'Mandioca Frita',
      description:
        'Mandioca cozida e frita na hora: crocante por fora e macia por dentro.',
      priceCents: 2490,
      category: 'Porções',
      variants: portionSizes(2490, 3990),
      addonGroups: [sauces],
    },
    {
      name: 'Torresmo de Rolo',
      description: 'Torresmo de rolo pururuca, servido com limão.',
      priceCents: 3490,
      category: 'Porções',
    },
    {
      name: 'Refrigerante Lata',
      description: 'Lata de 350 ml, bem gelada.',
      priceCents: 690,
      category: 'Bebidas',
      variants: variantsOf(
        'sabor',
        ['Cola', 'Guaraná', 'Laranja', 'Limão'],
        [24, 18, 0, 12],
      ),
    },
    {
      name: 'Suco Natural 500 ml',
      description: 'Feito na hora, com a fruta.',
      priceCents: 990,
      category: 'Bebidas',
      variants: variantsOf('sabor', ['Laranja', 'Maracujá', 'Limão']),
    },
    {
      name: 'Água Mineral',
      description: 'Garrafa de 500 ml.',
      priceCents: 400,
      category: 'Bebidas',
      variants: variantsOf('tipo', ['Sem gás', 'Com gás'], [30, 20]),
    },
    {
      name: 'Pudim de Leite',
      description: 'Pudim de leite condensado com calda de caramelo.',
      priceCents: 1290,
      category: 'Sobremesas',
    },
    {
      name: 'Doce de Leite com Queijo',
      description:
        'Doce de leite caseiro com queijo minas fresco: o clássico mineiro.',
      priceCents: 1190,
      category: 'Sobremesas',
      featured: true,
    },
  ],
};
