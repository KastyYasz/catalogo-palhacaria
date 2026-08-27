# 🤡 Palhaçaria & Cia — Catálogo Online

Catálogo online de **fantasias, máscaras e acessórios** da loja Palhaçaria & Cia. O cliente navega pelos produtos, monta o carrinho e finaliza o pedido diretamente pelo **WhatsApp**.

> 🎯 **Objetivo:** um catálogo leve, rápido e sem backend — o "carrinho" é apenas um agrupador que gera a mensagem do pedido, e a finalização acontece no WhatsApp ou nos marketplaces.

Construído com **[Astro](https://astro.build)**: o HTML é gerado em *build time*, os dados são injetados direto na página e a interação (carrinho, filtros, modal) roda em JavaScript puro no navegador — sem API nem banco de dados.

---

## ✨ Funcionalidades

- **Vitrine de produtos** — grade de cards renderizada a partir de dados em JSON (imagem, nome, categoria, subcategoria, tipo e preço).
- **Filtros combináveis** — busca por nome/descrição, categoria, subcategoria e tipo (com contador de resultados).
- **Variações de produto** — produtos com tamanho e/ou cor abrem um **modal** para seleção das opções antes de adicionar ao carrinho.
- **Carrinho lateral** — painel deslizante com itens, controle de quantidade (+/−), remoção, subtotal por item e total geral.
- **Persistência** — o carrinho é salvo no `localStorage`, sobrevivendo ao recarregar a página (com migração automática de itens salvos em versões antigas).
- **Campo de CEP** — máscara automática de formatação (`00000-000`) e frete "a combinar".
- **Finalização via WhatsApp** — gera uma mensagem formatada com os itens, variações, quantidades, total e CEP, abrindo o link `wa.me` do atendimento.
- **Banner em carrossel** — rotação automática de destaques com setas, indicadores e pausa no hover.
- **Notificações (toast)** — feedback visual ao adicionar produtos ao carrinho.
- **Links para marketplaces** — Mercado Livre, Magalu e Shopee no rodapé.
- **Rodapé completo** — atendimento, redes sociais, categorias (que aplicam filtros) e dados institucionais (CNPJ).
- **Responsivo e acessível** — se adapta a celulares/tablets, com `aria-label`s, estados de foco, `escapeHtml` (anti-XSS) e suporte a `prefers-reduced-motion`.

---

## 🧱 Estrutura do projeto

```
catalogo/
├── astro.config.mjs       # Configuração do Astro
├── package.json           # Dependências (astro) e scripts
├── package-lock.json
│
├── public/                # Arquivos estáticos servidos como estão
│   ├── style.css          # Folha de estilos (identidade visual da loja)
│   ├── app.js             # Lógica de interação (filtros, carrinho, modal...)
│   └── imagens/           # Imagens de produtos, banners e logos
│
└── src/
    ├── data/
    │   ├── produtos.json  # Dados dos produtos (fonte de verdade)
    │   ├── banners.json   # Slides do carrossel de banner
    │   └── produtos.ts    # Camada de dados tipada (lê os JSON em build time)
    ├── layouts/
    │   └── Base.astro     # Layout HTML base (head, meta, fonts)
    ├── components/
    │   ├── Header.astro
    │   ├── Hero.astro
    │   ├── Banner.astro
    │   ├── Filters.astro
    │   ├── ProductCard.astro
    │   ├── Cart.astro
    │   ├── ProductModal.astro
    │   └── Footer.astro
    └── pages/
        └── index.astro    # Página principal
```

> 💡 **Como os dados chegam ao navegador:** o `src/data/produtos.ts` lê os JSONs em **build time** e a página injeta tudo via `window.__PRODUTOS__`. Não há `fetch` em tempo de execução — o HTML já sai pronto, o que melhora o carregamento e o SEO.

---

## 🛠️ Tecnologias utilizadas

| Camada | Tecnologia |
|--------|------------|
| **Framework** | [Astro](https://astro.build) v4 (geração de site estático) |
| **Linguagens** | HTML5, CSS3, JavaScript (ES6+), TypeScript (camada de dados) |
| **Estilização** | CSS custom properties (variáveis), Flexbox, Grid, design responsivo (media queries), `prefers-reduced-motion` |
| **Fontes** | Google Fonts — *Baloo 2* (display) + *Nunito* (corpo) |
| **Dados** | JSON (`produtos.json`, `banners.json`) + `node:fs` em build time |
| **Persistência** | `localStorage` (carrinho) |
| **Integrações** | WhatsApp API (`wa.me`), links externos (Mercado Livre, Magalu, Shopee) |
| **Controle de versão** | Git / GitHub (hospedagem via GitHub Pages) |

---

## 🚀 Como rodar

Pré-requisito: [Node.js](https://nodejs.org) (16+).

```bash
npm install        # instala as dependências
npm run dev        # ambiente de desenvolvimento em http://localhost:4321
npm run build      # gera o site estático em dist/
npm run preview    # pré-visualiza o build em produção
```

---

## 📤 Como subir para o GitHub

Este repositório já está configurado com Git e apontando para o remoto `catalogo-palhacaria`. Para clonar e publicar:

```bash
# clonar
git clone https://github.com/KastyYasz/catalogo-palhacaria.git
cd catalogo-palhacaria
npm install

# ... depois de alguma mudança ...
git add .
git commit -m "descrição da mudança"
git push origin main
```

### Publicando no GitHub Pages

1. Rode o build: `npm run build` → gera `dist/`.
2. Em **Settings → Pages**, aponte o deploy para a branch/pasta correta, ou use um workflow de CI que rode `astro build` e publique `dist/`.

---

## 🔧 Como personalizar

- **Produtos** → edite `src/data/produtos.json` (campos: `id`, `nome`, `categoria`, `subcategoria`, `tipo`, `preco`, `imagem`, `descricao`, `tamanhos[]`, `cores[]`). Depois rode `npm run build`.
- **Banners** → edite `src/data/banners.json` (id, intervalo e imagens do carrossel).
- **WhatsApp / Marketplaces / redes** → procure os links em `src/data/produtos.ts` (lista `lojas`) e nos componentes `Footer.astro` / `Cart.astro` (`wa.me`).
- **Identidade visual** → as cores e fontes ficam centralizadas nas variáveis `:root` do `public/style.css`.

---

## 📦 Mercado de atuação

- **Loja física:** Ribeirão Preto / SP e região.
- **Canais:** WhatsApp, Mercado Livre, Magalu, Shopee e Instagram.
- **Pagamento:** Pix, cartão e boleto (via marketplaces).

---

## 📄 Licença

MIT — veja o arquivo [`LICENSE`](./LICENSE).

---

Feito com 🎪 e um carrinho cheio de confete.
