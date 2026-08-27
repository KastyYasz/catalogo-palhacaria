// Camada de dados: lê os JSON do catálogo real em BUILD TIME, com tipagem.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(__dirname, '../../..'); // pasta catalogo/

export interface Cor {
  nome: string;
  hex: string;
}

export interface Produto {
  id: number;
  nome: string;
  categoria: string;
  subcategoria: string;
  tipo: string;
  preco: number;
  imagem: string;
  descricao: string;
  tamanhos?: string[];
  cores?: Cor[];
}

export interface Loja {
  nome: string;
  icon: string;
  height: string;
  url: string;
}

export interface BannerImagem {
  src: string;
  alt: string;
}

export interface Banner {
  id: string;
  intervalo: number;
  imagens: BannerImagem[];
}

export const produtos: Produto[] = JSON.parse(
  readFileSync(resolve(raiz, 'produtos.json'), 'utf-8')
);

export const banners: Banner[] = JSON.parse(
  readFileSync(resolve(raiz, 'banners.json'), 'utf-8')
);

// Lojas externas (mantém os links reais do rodapé).
export const lojas: Loja[] = [
  {
    nome: 'Mercado Livre',
    icon: 'imagens/iconMl.webp',
    height: '30px',
    url: 'https://lista.mercadolivre.com.br/_CustId_189210597',
  },
  {
    nome: 'Magalu',
    icon: 'imagens/iconMagalu.png',
    height: '30px',
    url: 'https://www.magazineluiza.com.br/busca/Palhaçaria&cia',
  },
  {
    nome: 'Shopee',
    icon: 'imagens/iconShopee.webp',
    height: '30px',
    url: 'https://shopee.com.br/shop/418327900/',
  },
];

// Helpers reaproveitados do script original.
export function normalizarCss(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function capitalizar(str: string): string {
  if (!str && str !== '0') return '';
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

export function formatarPreco(valor: number): string {
  return valor.toFixed(2).replace('.', ',');
}

// Conjunto de valores únicos para popular os filtros.
export function valoresUnicos(lista: (string | null | undefined)[]): string[] {
  return [
    ...new Set(lista.filter((v) => v !== null && v !== undefined && v !== '')),
  ].sort();
}
