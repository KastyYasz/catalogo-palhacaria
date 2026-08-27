import { defineConfig } from 'astro/config';

// Catálogo Palhaçaria & Cia — Astro (HTML estático + ilhas de interação).
// As imagens ficam em public/imagens (copiadas do catálogo real).
// output 'static' gera o site como arquivos HTML puros em dist/,
// prontos para hospedar no GitHub Pages (sem servidor).
export default defineConfig({
  output: 'static',
});
