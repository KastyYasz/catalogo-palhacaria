/* ============================================
   PALHAÇARIA & CIA — script.js
   Responsável por:
   - Carregar produtos do JSON
   - Renderizar cards com filtros
   - Gerenciar carrinho (localStorage)
   - Finalizar pedido via WhatsApp
   ============================================ */

// ─── Links das lojas externas ──
// Substitua os valores abaixo pelos links reais das lojas, se mudarem.
const LOJAS_EXTERNAS = {
  mercadoLivreUrl: 'https://lista.mercadolivre.com.br/_CustId_189210597',
  magaluUrl:       'https://www.magazineluiza.com.br/busca/Palhaçaria&cia',
  shopeeUrl:       'https://shopee.com.br/shop/418327900/'
};

// ─── Estado global ────────────────────────────
let todosProdutos = [];   // todos os produtos carregados do JSON
let filtroAtual = {       // filtros selecionados atualmente
  categoria: '',
  subcategoria: '',
  tipo: '',
  busca: ''
};

// Estado do modal de tamanho/cor
let produtoModalAtual = null;
let tamanhoSelecionado = null;
let corSelecionada     = null;

// ─── Referências DOM ──────────────────────────
const gradeEl        = document.getElementById('grade-produtos');
const infEl          = document.getElementById('info-resultados');
const selCat         = document.getElementById('filtro-categoria');
const selSub         = document.getElementById('filtro-subcategoria');
const selTipo        = document.getElementById('filtro-tipo');
const btnLimpar      = document.getElementById('btn-limpar-filtros');
const contador       = document.getElementById('contador-carrinho');
const overlay        = document.getElementById('overlay');
const painel         = document.getElementById('painel-carrinho');
const btnAbrir       = document.getElementById('btn-abrir-carrinho');
const btnFechar      = document.getElementById('btn-fechar-carrinho');
const listaCarrinho  = document.getElementById('lista-carrinho');
const totalGeralEl   = document.getElementById('valor-total');
const inputCEP       = document.getElementById('input-cep');
const btnWpp         = document.getElementById('btn-whatsapp');
const toastEl        = document.getElementById('toast');
const buscaInput     = document.getElementById('busca-produto');

// Banner
const bannerSecao    = document.getElementById('banner-topo');

// Modal de opções (tamanho/cor)
const modalOverlay      = document.getElementById('modal-overlay');
const modalProduto      = document.getElementById('modal-produto');
const btnFecharModal    = document.getElementById('btn-fechar-modal');
const modalImagemEl     = document.getElementById('modal-produto-imagem');
const modalTituloEl     = document.getElementById('modal-produto-titulo');
const modalPrecoEl      = document.getElementById('modal-produto-preco');
const blocoTamanho      = document.getElementById('modal-opcoes-tamanho');
const blocoCor          = document.getElementById('modal-opcoes-cor');
const listaTamanhosEl   = document.getElementById('lista-tamanhos');
const listaCoresEl      = document.getElementById('lista-cores');
const modalAvisoEl      = document.getElementById('modal-aviso');
const btnConfirmarOpcoes = document.getElementById('btn-confirmar-opcoes');

// Rodapé lojas externas
const rodapeLojasEl  = document.getElementById('rodape-lojas-cards');

// ─── Inicialização ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  atualizarCarrinhoUI();
  carregarBanners();
  renderizarRodapeLojas();

  const rodapeAnoEl = document.getElementById('rodape-ano');
  if (rodapeAnoEl) rodapeAnoEl.textContent = new Date().getFullYear();

  // Modal de tamanho/cor
  btnFecharModal.addEventListener('click', fecharModalProduto);
  modalOverlay.addEventListener('click', fecharModalProduto);
  btnConfirmarOpcoes.addEventListener('click', confirmarOpcoesProduto);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModalProduto();
  });

  // Eventos de filtro
  selCat.addEventListener('change', e => {
    filtroAtual.categoria = e.target.value;
    renderizarProdutos();
  });
  selSub.addEventListener('change', e => {
    filtroAtual.subcategoria = e.target.value;
    renderizarProdutos();
  });
  selTipo.addEventListener('change', e => {
    filtroAtual.tipo = e.target.value;
    renderizarProdutos();
  });
  btnLimpar.addEventListener('click', limparFiltros);

  // Busca por texto (com debounce)
  let buscaTimer = null;
  buscaInput.addEventListener('input', e => {
    clearTimeout(buscaTimer);
    buscaTimer = setTimeout(() => {
      filtroAtual.busca = e.target.value.trim().toLowerCase();
      renderizarProdutos();
    }, 300);
  });

  // Links de categoria no rodapé: aplicam o filtro correspondente
  document.querySelectorAll('#rodape-links-categorias a[data-filtro-cat], #rodape-links-categorias a[data-filtro-sub], #rodape-links-categorias a[data-filtro-tipo]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      filtroAtual = {
        categoria:    a.dataset.filtroCat  || '',
        subcategoria: a.dataset.filtroSub  || '',
        tipo:         a.dataset.filtroTipo || ''
      };
      selCat.value  = filtroAtual.categoria;
      selSub.value  = filtroAtual.subcategoria;
      selTipo.value = filtroAtual.tipo;
      renderizarProdutos();
      document.getElementById('grade-produtos').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Rodapé: "Ver tudo" limpa filtros; "Meu carrinho" abre o painel
  document.querySelectorAll('[data-limpar-filtros]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); limparFiltros(); });
  });
  document.querySelectorAll('[data-abrir-carrinho]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); abrirCarrinho(); });
  });

  // Carrinho
  btnAbrir.addEventListener('click', abrirCarrinho);
  btnFechar.addEventListener('click', fecharCarrinho);
  overlay.addEventListener('click', fecharCarrinho);

  // WhatsApp
  btnWpp.addEventListener('click', finalizarPedido);

  // Máscara CEP
  inputCEP.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 8);
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
    e.target.value = v;
  });
});

// ─── Carregar JSON ────────────────────────────
async function carregarProdutos() {
  try {
    const res = await fetch('produtos.json');
    if (!res.ok) throw new Error('Arquivo não encontrado');
    todosProdutos = await res.json();
    popularFiltros();
    renderizarProdutos();
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    gradeEl.innerHTML = `
      <div class="vazio">
        <div class="emoji">😕</div>
        <p>Não foi possível carregar os produtos.<br>Verifique o arquivo <strong>produtos.json</strong>.</p>
      </div>`;
  }
}

// ─── Popular selects de filtro ────────────────
function popularFiltros() {
  const cats  = valoresUnicos(todosProdutos.map(p => p.categoria));
  const subs  = valoresUnicos(todosProdutos.map(p => p.subcategoria));
  const tipos = valoresUnicos(todosProdutos.map(p => p.tipo));

  adicionarOpcoes(selCat,  cats,  'Todas as categorias');
  adicionarOpcoes(selSub,  subs,  'Todas as subcategorias');
  adicionarOpcoes(selTipo, tipos, 'Todos os tipos');
}

// Remove valores nulos/vazios e elimina duplicatas
function valoresUnicos(lista) {
  return [...new Set(lista.filter(v => v !== null && v !== undefined && v !== ''))].sort();
}

function adicionarOpcoes(select, valores, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  valores.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = capitalizar(v);
    select.appendChild(opt);
  });
}

// ─── Renderizar grade de produtos ─────────────
function renderizarProdutos() {
  const filtrados = todosProdutos.filter(p => {
    const matchBusca = !filtroAtual.busca ||
      p.nome.toLowerCase().includes(filtroAtual.busca) ||
      (p.descricao && p.descricao.toLowerCase().includes(filtroAtual.busca));
    return (
      matchBusca &&
      (!filtroAtual.categoria    || p.categoria    === filtroAtual.categoria) &&
      (!filtroAtual.subcategoria || p.subcategoria === filtroAtual.subcategoria) &&
      (!filtroAtual.tipo         || p.tipo         === filtroAtual.tipo)
    );
  });

  // Atualiza info de resultados
  infEl.textContent = `${filtrados.length} produto${filtrados.length !== 1 ? 's' : ''} encontrado${filtrados.length !== 1 ? 's' : ''}`;

  if (filtrados.length === 0) {
    gradeEl.innerHTML = `
      <div class="vazio">
        <div class="emoji">🎭</div>
        <p>Nenhum produto encontrado com esses filtros.</p>
      </div>`;
    return;
  }

  gradeEl.innerHTML = '';
  filtrados.forEach(produto => {
    gradeEl.appendChild(criarCardProduto(produto));
  });
}

// ─── Criar card de produto ────────────────────
function criarCardProduto(produto) {
  const card = document.createElement('div');
  card.className = 'card-produto';
  card.innerHTML = `
    <div class="imagem-wrapper">
      <img
        src="${produto.imagem}"
        alt="${produto.nome}"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/400x400/E8232A/FFFFFF?text=Sem+Imagem'"
      />
    </div>
    <span class="badge-categoria ${normalizarCss(produto.categoria)}">${capitalizar(produto.categoria)}</span>
    <div class="card-corpo">
      <h3>${produto.nome}</h3>
      <div class="card-meta">
        <span class="tag">${capitalizar(produto.subcategoria)}</span>
        <span class="tag">${capitalizar(produto.tipo)}</span>
      </div>
      <div class="card-preco">
        <small>R$</small> ${formatarPreco(produto.preco)}
      </div>
    </div>
    <button class="btn-adicionar${temVariacoes(produto) ? ' tem-opcoes' : ''}" data-id="${produto.id}">
      🛒 ${temVariacoes(produto) ? 'Escolher Opções' : 'Adicionar ao Carrinho'}
    </button>
  `;

  card.querySelector('.btn-adicionar').addEventListener('click', () => {
    if (temVariacoes(produto)) {
      abrirModalProduto(produto);
    } else {
      adicionarAoCarrinho(produto);
    }
  });

  return card;
}

// Um produto "tem variações" se possuir tamanhos e/ou cores selecionáveis
function temVariacoes(produto) {
  return (Array.isArray(produto.tamanhos) && produto.tamanhos.length > 0) ||
         (Array.isArray(produto.cores) && produto.cores.length > 0);
}

// ═══════════════════════════════════════════════
//  BANNER / CARROSSEL
// ═══════════════════════════════════════════════

async function carregarBanners() {
  if (!bannerSecao) return;
  try {
    const res = await fetch('banners.json');
    if (!res.ok) throw new Error('Arquivo de banners não encontrado');
    const banners = await res.json();

    const bannerId = bannerSecao.dataset.bannerId;
    const dados = banners.find(b => b.id === bannerId) || banners[0];
    if (dados) iniciarCarrossel(dados, bannerSecao);
    else bannerSecao.style.display = 'none';
  } catch (err) {
    console.error('Erro ao carregar banners:', err);
    bannerSecao.style.display = 'none';
  }
}

// Inicializa um carrossel de banner dentro de um container.
// Reutilizável: pode ser chamado para qualquer banner com 1+ imagens.
function iniciarCarrossel(dados, containerEl) {
  const slidesEl = containerEl.querySelector('.banner-slides');
  const indicadoresEl = containerEl.querySelector('.banner-indicadores');
  const btnPrev = containerEl.querySelector('.banner-seta-prev');
  const btnNext = containerEl.querySelector('.banner-seta-next');
  const imagens = dados.imagens || [];

  if (imagens.length === 0) {
    containerEl.style.display = 'none';
    return;
  }

  let atual = 0;
  const intervalo = dados.intervalo || 5000;
  let timer = null;

  slidesEl.innerHTML = imagens.map((img, i) => `
    <div class="banner-slide${i === 0 ? ' ativo' : ''}">
      <img src="${img.src}" alt="${img.alt || ''}" loading="${i === 0 ? 'eager' : 'lazy'}" />
    </div>
  `).join('');

  const slideEls = slidesEl.querySelectorAll('.banner-slide');

  // Esconde setas/indicadores se houver só uma imagem
  const mostrarControles = imagens.length > 1;
  btnPrev.style.display = mostrarControles ? 'flex' : 'none';
  btnNext.style.display = mostrarControles ? 'flex' : 'none';

  if (mostrarControles) {
    indicadoresEl.innerHTML = imagens.map((_, i) => `
      <button class="banner-ponto${i === 0 ? ' ativo' : ''}" aria-label="Ir para imagem ${i + 1}" role="tab"></button>
    `).join('');
  }
  const pontoEls = indicadoresEl.querySelectorAll('.banner-ponto');

  function irPara(indice) {
    slideEls[atual].classList.remove('ativo');
    if (pontoEls[atual]) pontoEls[atual].classList.remove('ativo');

    atual = (indice + imagens.length) % imagens.length;

    slideEls[atual].classList.add('ativo');
    if (pontoEls[atual]) pontoEls[atual].classList.add('ativo');
  }

  function proximo() { irPara(atual + 1); }
  function anterior() { irPara(atual - 1); }

  function iniciarAutoplay() {
    if (!mostrarControles) return;
    parar();
    timer = setInterval(proximo, intervalo);
  }
  function parar() { clearInterval(timer); }

  btnNext.addEventListener('click', () => { proximo(); iniciarAutoplay(); });
  btnPrev.addEventListener('click', () => { anterior(); iniciarAutoplay(); });
  pontoEls.forEach((ponto, i) => {
    ponto.addEventListener('click', () => { irPara(i); iniciarAutoplay(); });
  });

  containerEl.addEventListener('mouseenter', parar);
  containerEl.addEventListener('mouseleave', iniciarAutoplay);

  iniciarAutoplay();
}

// ═══════════════════════════════════════════════
//  MODAL: SELEÇÃO DE TAMANHO / COR
// ═══════════════════════════════════════════════

function abrirModalProduto(produto) {
  produtoModalAtual = produto;
  tamanhoSelecionado = null;
  corSelecionada = null;
  modalAvisoEl.textContent = '';

  modalImagemEl.src = produto.imagem;
  modalImagemEl.alt = produto.nome;
  modalTituloEl.textContent = produto.nome;
  modalPrecoEl.textContent = formatarPreco(produto.preco);

  // Tamanhos
  const temTamanhos = Array.isArray(produto.tamanhos) && produto.tamanhos.length > 0;
  blocoTamanho.classList.toggle('visivel', temTamanhos);
  if (temTamanhos) {
    listaTamanhosEl.innerHTML = produto.tamanhos.map(t => `
      <button type="button" class="opcao-tamanho" data-tamanho="${t}">${t}</button>
    `).join('');
    listaTamanhosEl.querySelectorAll('.opcao-tamanho').forEach(btn => {
      btn.addEventListener('click', () => {
        listaTamanhosEl.querySelectorAll('.opcao-tamanho').forEach(b => b.classList.remove('selecionado'));
        btn.classList.add('selecionado');
        tamanhoSelecionado = btn.dataset.tamanho;
        modalAvisoEl.textContent = '';
      });
    });
  }

  // Cores
  const temCores = Array.isArray(produto.cores) && produto.cores.length > 0;
  blocoCor.classList.toggle('visivel', temCores);
  if (temCores) {
    listaCoresEl.innerHTML = produto.cores.map(c => `
      <button type="button" class="opcao-cor" data-cor="${c.nome}" style="background:${c.hex}" title="${c.nome}" aria-label="${c.nome}"></button>
    `).join('');
    listaCoresEl.querySelectorAll('.opcao-cor').forEach(btn => {
      btn.addEventListener('click', () => {
        listaCoresEl.querySelectorAll('.opcao-cor').forEach(b => b.classList.remove('selecionado'));
        btn.classList.add('selecionado');
        corSelecionada = btn.dataset.cor;
        modalAvisoEl.textContent = '';
      });
    });
  }

  modalOverlay.classList.add('ativo');
  modalProduto.classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function fecharModalProduto() {
  modalOverlay.classList.remove('ativo');
  modalProduto.classList.remove('aberto');
  document.body.style.overflow = '';
  produtoModalAtual = null;
}

function confirmarOpcoesProduto() {
  if (!produtoModalAtual) return;

  const precisaTamanho = Array.isArray(produtoModalAtual.tamanhos) && produtoModalAtual.tamanhos.length > 0;
  const precisaCor     = Array.isArray(produtoModalAtual.cores) && produtoModalAtual.cores.length > 0;

  if (precisaTamanho && !tamanhoSelecionado) {
    modalAvisoEl.textContent = '⚠️ Selecione um tamanho para continuar.';
    return;
  }
  if (precisaCor && !corSelecionada) {
    modalAvisoEl.textContent = '⚠️ Selecione uma cor para continuar.';
    return;
  }

  adicionarAoCarrinho(produtoModalAtual, tamanhoSelecionado, corSelecionada);
  fecharModalProduto();
}

// ═══════════════════════════════════════════════
//  RODAPÉ: LOJAS EXTERNAS
// ═══════════════════════════════════════════════

function renderizarRodapeLojas() {
  if (!rodapeLojasEl) return;
  const lojas = [
    {nome: 'Mercado Livre', icon: 'imagens/iconMl.webp',   height: '30px', url: LOJAS_EXTERNAS.mercadoLivreUrl },
    {nome: 'Magalu',        icon: 'imagens/iconMagalu.png', height: '30px', url: LOJAS_EXTERNAS.magaluUrl },
    {nome: 'Shopee',        icon: 'imagens/iconShopee.webp', height: '30px', url: LOJAS_EXTERNAS.shopeeUrl }
  ];

  rodapeLojasEl.innerHTML = lojas.map(l => `
    <a class="loja-card" href="${encodeURI(l.url)}" target="_blank" rel="noopener noreferrer" title="${l.nome}">
      <img class="loja-icon" src="${l.icon}" alt="${l.nome}" style="height: ${l.height}">
      <span>${l.nome}</span>
    </a>
  `).join('');
}

// ─── Limpar filtros ───────────────────────────
function limparFiltros() {
  filtroAtual = { categoria: '', subcategoria: '', tipo: '', busca: '' };
  selCat.value  = '';
  selSub.value  = '';
  selTipo.value = '';
  buscaInput.value = '';
  renderizarProdutos();
}

// ═══════════════════════════════════════════════
//  CARRINHO
// ═══════════════════════════════════════════════

// ─── Ler / Gravar localStorage ────────────────
function lerCarrinho() {
  try {
    const carrinho = JSON.parse(localStorage.getItem('palhacaria_carrinho')) || [];
    // Migração: itens salvos antes de existir tamanho/cor não têm "chave"
    carrinho.forEach(item => {
      if (!item.chave) item.chave = gerarChaveCarrinho(item.id, item.tamanho, item.cor);
    });
    return carrinho;
  } catch { return []; }
}

function salvarCarrinho(carrinho) {
  localStorage.setItem('palhacaria_carrinho', JSON.stringify(carrinho));
}

// Gera uma chave única por produto + variação (tamanho/cor).
// Produtos sem variação continuam usando só o id, como antes.
function gerarChaveCarrinho(id, tamanho, cor) {
  return `${id}|${tamanho || ''}|${cor || ''}`;
}

// ─── Adicionar produto ────────────────────────
function adicionarAoCarrinho(produto, tamanho = null, cor = null) {
  const carrinho = lerCarrinho();
  const chave = gerarChaveCarrinho(produto.id, tamanho, cor);
  const idx = carrinho.findIndex(i => i.chave === chave);

  if (idx >= 0) {
    carrinho[idx].quantidade++;
  } else {
    carrinho.push({
      chave,
      id:         produto.id,
      nome:       produto.nome,
      preco:      produto.preco,
      imagem:     produto.imagem,
      tamanho:    tamanho || null,
      cor:        cor || null,
      quantidade: 1
    });
  }

  salvarCarrinho(carrinho);
  atualizarCarrinhoUI();
  mostrarToast(`✅ "${produto.nome}" adicionado!`);
  animarContador();
}

// ─── Alterar quantidade ───────────────────────
function alterarQuantidade(chave, delta) {
  const carrinho = lerCarrinho();
  const idx = carrinho.findIndex(i => i.chave === chave);
  if (idx < 0) return;

  carrinho[idx].quantidade += delta;

  if (carrinho[idx].quantidade <= 0) {
    carrinho.splice(idx, 1);
  }

  salvarCarrinho(carrinho);
  atualizarCarrinhoUI();
}

// ─── Remover item ──────────────────────────────
function removerItem(chave) {
  const carrinho = lerCarrinho().filter(i => i.chave !== chave);
  salvarCarrinho(carrinho);
  atualizarCarrinhoUI();
}

// ─── Atualizar toda a UI do carrinho ──────────
function atualizarCarrinhoUI() {
  const carrinho = lerCarrinho();
  const totalItens = carrinho.reduce((s, i) => s + i.quantidade, 0);
  const totalValor = carrinho.reduce((s, i) => s + (i.preco * i.quantidade), 0);

  // Contador no header
  contador.textContent = totalItens;
  contador.style.display = totalItens > 0 ? 'flex' : 'none';

  // Habilita/desabilita botão WhatsApp
  btnWpp.disabled = totalItens === 0;

  // Renderiza lista
  if (carrinho.length === 0) {
    listaCarrinho.innerHTML = `
      <div class="carrinho-vazio">
        <div class="emoji">🛒</div>
        <p>Seu carrinho está vazio.<br>Adicione produtos para continuar!</p>
      </div>`;
  } else {
    listaCarrinho.innerHTML = '';
    carrinho.forEach(item => {
      listaCarrinho.appendChild(criarItemCarrinho(item));
    });
  }

  // Total geral
  totalGeralEl.textContent = `R$ ${formatarPreco(totalValor)}`;
}

// ─── Criar elemento de item do carrinho ───────
function criarItemCarrinho(item) {
  const div = document.createElement('div');
  div.className = 'item-carrinho';
  div.innerHTML = `
    <img
      src="${item.imagem}"
      alt="${item.nome}"
      onerror="this.src='https://via.placeholder.com/60x60/E8232A/FFFFFF?text=?'"
    />
    <div class="item-info">
      <strong title="${item.nome}">${item.nome}</strong>
      ${(item.tamanho || item.cor) ? `
        <span class="variacao">${item.tamanho ? `Tam: ${item.tamanho}` : ''}${item.tamanho && item.cor ? ' · ' : ''}${item.cor ? `Cor: ${item.cor}` : ''}</span>
      ` : ''}
      <span class="preco-unit">R$ ${formatarPreco(item.preco)} cada</span>
    </div>
    <div class="item-controles">
      <div class="item-total">R$ ${formatarPreco(item.preco * item.quantidade)}</div>
      <div class="qtd-controle">
        <button class="btn-qtd btn-menos" title="Diminuir">−</button>
        <span class="qtd-valor">${item.quantidade}</span>
        <button class="btn-qtd btn-mais" title="Aumentar">+</button>
      </div>
      <button class="btn-remover" title="Remover item">🗑️</button>
    </div>
  `;

  div.querySelector('.btn-menos').addEventListener('click',  () => alterarQuantidade(item.chave, -1));
  div.querySelector('.btn-mais').addEventListener('click',   () => alterarQuantidade(item.chave, +1));
  div.querySelector('.btn-remover').addEventListener('click', () => removerItem(item.chave));

  return div;
}

// ─── Abrir / Fechar painel ────────────────────
function abrirCarrinho() {
  painel.classList.add('aberto');
  overlay.classList.add('ativo');
  document.body.style.overflow = 'hidden';
}

function fecharCarrinho() {
  painel.classList.remove('aberto');
  overlay.classList.remove('ativo');
  document.body.style.overflow = '';
}

// ─── Finalizar pedido via WhatsApp ────────────
function finalizarPedido() {
  const carrinho = lerCarrinho();
  if (carrinho.length === 0) return;

  const cep = inputCEP.value.trim() || 'Não informado';
  const total = carrinho.reduce((s, i) => s + (i.preco * i.quantidade), 0);

  let linhasProdutos = carrinho.map(i => {
    const sub = formatarPreco(i.preco * i.quantidade);
    const variacao = (i.tamanho || i.cor)
      ? ` [${i.tamanho ? `Tam: ${i.tamanho}` : ''}${i.tamanho && i.cor ? ' | ' : ''}${i.cor ? `Cor: ${i.cor}` : ''}]`
      : '';
    return `• ${i.nome}${variacao} (${i.quantidade}x) — R$ ${sub}`;
  }).join('\n');

  const mensagem =
` *Palhaçaria & Cia — Novo Pedido* 

 *Produtos selecionados:*
${linhasProdutos}

 *Total: R$ ${formatarPreco(total)}*

 *CEP para entrega:* ${cep}
 *Frete a combinar*

Olá! Gostaria de fazer esse pedido. Aguardo confirmação! `;

  const urlWpp = `https://wa.me/551636336445?text=${encodeURIComponent(mensagem)}`;
  window.open(urlWpp, '_blank');
}

// ═══════════════════════════════════════════════
//  UTILITÁRIOS
// ═══════════════════════════════════════════════

function formatarPreco(valor) {
  return valor.toFixed(2).replace('.', ',');
}

function capitalizar(str) {
  if (!str && str !== 0) return '';
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

// Normaliza string para uso como classe CSS (remove acentos e espaços)
function normalizarCss(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

// Toast de notificação
let toastTimer;
function mostrarToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('visivel');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('visivel'), 2500);
}

// Animação do contador
function animarContador() {
  contador.classList.remove('bounce');
  void contador.offsetWidth; // forçar reflow
  contador.classList.add('bounce');
}
