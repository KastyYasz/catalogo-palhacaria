// Camada de dados: os JSONs são importados diretamente (em vez de ler via
// fs em runtime). O Vite/Astro resolve e embute o conteúdo em build time,
// então os dados ficam disponíveis tanto no pré-render (HTML estático)
// quanto no `window.__PRODUTOS__` injetado na página.
import produtosJson from './produtos.json';
import bannersJson from './banners.json';

// ── Tipos ────────────────────────────────────
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

export interface BannerImagem {
  src: string;
  alt: string;
}

export interface Banner {
  id: string;
  intervalo: number;
  imagens: BannerImagem[];
}

export interface Loja {
  nome: string;
  icon: string;
  height: string;
  url: string;
}

// ── Dados ────────────────────────────────────
export const produtos: Produto[] = produtosJson;
export const banners: Banner[] = bannersJson;

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

// ── Helpers ──────────────────────────────────
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
