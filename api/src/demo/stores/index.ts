import { DemoStore } from '../demo-types';
import { bichoBao } from './bicho-bao';
import { fomeSo } from './fome-so';
import { modaChic } from './moda-chic';

/**
 * Lojas de demonstração. Para criar uma loja nova (ex.: Trecos Variedades),
 * basta um arquivo novo aqui: nenhuma linha da API precisa mudar.
 */
export const DEMO_STORES: DemoStore[] = [modaChic, fomeSo, bichoBao];
