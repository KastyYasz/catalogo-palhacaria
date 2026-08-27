# 🤡 Palhaçaria & Cia — Catálogo Online

Catálogo online de **fantasias, máscaras e acessórios** da loja Palhaçaria & Cia. O cliente navega pelos produtos, monta o carrinho e finaliza o pedido diretamente pelo **WhatsApp**.

> 🎯 **Objetivo:** ser um catálogo leve, rápido e sem backend — o "carrinho" é apenas um agrupador que gera a mensagem do pedido, e a finalização acontece no WhatsApp ou nos marketplaces.

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
- **Responsivo e acessível** — se adapta a celulares/tablets, com `aria-label`s, estados de foco e suporte a `prefers-reduced-motion`.

---

## 🧱 Estrutura do projeto

O projeto tem **duas pegadas** dentro da mesma pasta: uma versão **estática** (HTML puro, pronta para abrir direto) e uma **reconstrução em Astro** (para build estático otimizado).

```
catalogo/
├── index.html          # Versão estática — página principal (HTML puro)
├── style.css           # Estilos (identidade visual da loja)
├── script.js           # Lógica da versão estática (fetch do JSON no navegador)
├── produtos.json       # Dados dos produtos (fonte de verdade)
├── banners.json        # Slides do banner/carrossel
├── imagens/            # Imagens de produtos, banners e logos
│
└── astro/              # Versão em Astro (build estático)
    ├── astro.config.mjs
    ├── package.json
    ├── public/
    │   ├── style.css        # Mesma folha de estilos
    │   ├── app.js           # Lógica portada (dados injetados em build time)
    │   └── imagens/         # Cópias das imagens
    └── src/
        ├── data/produtos.ts       # Camada de dados tipada (lê os JSON em build time)
        ├── layouts/Base.astro     # Layout HTML base
        ├── components/            # Header, Hero, Banner, Filters, ProductCard,
        │                          # Cart, ProductModal, Footer
        └── pages/index.astro      # Página principal
```

> 💡 **As duas versões são funcionalmente equivalentes.** A diferença está em *como* os dados chegam ao navegador:
> - **Estática:** o `script.js` faz `fetch('produtos.json')` em tempo de execução.
> - **Astro:** o `produtos.ts` lê os JSON em **build time** e injeta via `window.__PRODUTOS__` — sem fetch no navegador e com `escapeHtml` para proteção contra XSS.

---

## 🛠️ Tecnologias utilizadas

| Camada | Tecnologia |
|--------|------------|
| **Linguagens** | HTML5, CSS3, JavaScript (ES6+) |
| **Estilização** | CSS custom properties (variáveis), Flexbox, Grid, design responsivo (media queries), `prefers-reduced-motion` |
| **Fontes** | Google Fonts — *Baloo 2* (display) + *Nunito* (corpo) |
| **Dados** | JSON (`produtos.json`, `banners.json`) |
| **Persistência** | `localStorage` (carrinho) |
| **Versão Astro** | [Astro](https://astro.build) v4 (geração de site estático) + TypeScript na camada de dados |
| **Integrações** | WhatsApp API (`wa.me`), links externos (Mercado Livre, Magalu, Shopee) |
| **Controle de versão** | Git / GitHub (hospedagem via GitHub Pages) |

---

## 🚀 Como rodar

### Versão estática (a mais simples)

Basta abrir o `index.html` no navegador, ou servir a pasta com qualquer servidor estático:

```bash
# na raiz do catálogo
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

> ⚠️ Por causa do `fetch()` do JSON, recomenda-se abrir via servidor (ou hospedar), e não direto com `file://`.

### Versão Astro

```bash
cd astro
npm install        # instala as dependências
npm run dev        # ambiente de desenvolvimento em http://localhost:4321
npm run build      # gera o site estático em astro/dist/
npm run preview    # pré-visualiza o build
```

---

## 📤 Como subir para o GitHub

1. **Crie o repositório** no GitHub (ex.: `palhacaria-catalogo`).
2. **Inicialize o Git** na raiz do projeto:

```bash
cd caminho/para/catalogo
git init
git add .
git commit -m "feat: catálogo Palhaçaria & Cia"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/palhacaria-catalogo.git
git push -u origin main
```

3. **Habilite o GitHub Pages** (Settings → Pages → *Deploy from a branch* → `main` / `master` / `/root` ou `/docs`).

> Para a versão estática, o GitHub Pages servirá o `index.html` raiz direto — sem build.

### Opção com Git LFS (recomendado para as imagens)

O repositório contém muitas imagens `.webp`/`.png`. Se preferir não "inchar" o histórico, use [Git LFS](https://git-lfs.com):

```bash
git lfs install
git lfs track "*.webp" "*.png" "*.jpg"
git add .gitattributes
git commit -m "chore: rastrear imagens com Git LFS"
```

### Publicando a versão Astro no GitHub Pages

```bash
cd astro
npm install
# Astro gera o site em dist/ (ajuste se usar subpasta do projeto)
npm run build
```

Depois aponte o GitHub Pages para a pasta `astro/dist` (ou configure um workflow de CI para buildar automaticamente).

---

## 🔧 Como personalizar

- **Produtos** → edite `produtos.json` (campos: `id`, `nome`, `categoria`, `subcategoria`, `tipo`, `preco`, `imagem`, `descricao`, `tamanhos[]`, `cores[]`).
- **Banners** → edite `banners.json` (id, intervalo e imagens do carrossel).
- **WhatsApp / Marketplaces / redes** → procure os links em `script.js` (constante `LOJAS_EXTERNAS` e `wa.me`) e no próprio `index.html`.
- **Identidade visual** → as cores e fontes ficam centralizadas nas variáveis `:root` do `style.css`.

---

## 📦 Mercado de atuação

- **Loja física:** Ribeirão Preto / SP e região.
- **Canais:** WhatsApp, Mercado Livre, Magalu, Shopee e Instagram.
- **Pagamento:** Pix, cartão e boleto (via marketplaces).

---

## 📄 Licença

Este repositório é de uso privado/comercial da loja Palhaçaria & Cia. Os dados de produtos, imagens e identidade visual são de propriedade da loja.

---

Feito com 🎪 e um carrinho cheio de confete.
