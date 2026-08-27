// ============================================================================
// PALHAÇARIA & CIA — script de interação (vanilla JS, estático em /app.js)
// Portado do script.js original. Recebe os produtos via window.__PRODUTOS__
// (injetado em build time, sem fetch). Cuida de:
//  - popular filtros + renderizar cards (HTML já estático; re-renderiza no filtro)
//  - carrinho (localStorage) + total + CEP
//  - modal de tamanho/cor
//  - finalizar pedido via WhatsApp
//  - carrossel do banner
//  - toast
// ============================================================================

const todosProdutos = window.__PRODUTOS__ || [];

// ─── Estado ───────────────────────────────────
let filtroAtual = { categoria: '', subcategoria: '', tipo: '' };

// Estado do modal
let produtoModalAtual = null;
let tamanhoSelecionado = null;
let corSelecionada = null;

// ─── Referências DOM ──────────────────────────
const gradeEl = document.getElementById('grade-produtos');
const infEl = document.getElementById('info-resultados');
const selCat = document.getElementById('filtro-categoria');
const selSub = document.getElementById('filtro-subcategoria');
const selTipo = document.getElementById('filtro-tipo');
const btnLimpar = document.getElementById('btn-limpar-filtros');

const contador = document.getElementById('contador-carrinho');
const overlay = document.getElementById('overlay');
const painel = document.getElementById('painel-carrinho');
const btnAbrir = document.getElementById('btn-abrir-carrinho');
const btnFechar = document.getElementById('btn-fechar-carrinho');
const listaCarrinho = document.getElementById('lista-carrinho');
const totalGeralEl = document.getElementById('valor-total');
const inputCEP = document.getElementById('input-cep');
const btnWpp = document.getElementById('btn-whatsapp');
const toastEl = document.getElementById('toast');

// Modal
const modalOverlay = document.getElementById('modal-overlay');
const modalProduto = document.getElementById('modal-produto');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const modalImagemEl = document.getElementById('modal-produto-imagem');
const modalTituloEl = document.getElementById('modal-produto-titulo');
const modalPrecoEl = document.getElementById('modal-produto-preco');
const blocoTamanho = document.getElementById('modal-opcoes-tamanho');
const blocoCor = document.getElementById('modal-opcoes-cor');
const listaTamanhosEl = document.getElementById('lista-tamanhos');
const listaCoresEl = document.getElementById('lista-cores');
const modalAvisoEl = document.getElementById('modal-aviso');
const btnConfirmarOpcoes = document.getElementById('btn-confirmar-opcoes');

// Banner
const bannerSecao = document.getElementById('banner-topo');

// ─── Utilidades ───────────────────────────────
function formatarPreco(valor) {
  return valor.toFixed(2).replace('.', ',');
}
function capitalizar(str) {
  if (!str && str !== 0) return '';
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}
function normalizarCss(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}
function valoresUnicos(lista) {
  return [...new Set(lista.filter((v) => v !== null && v !== undefined && v !== ''))].sort();
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
function temVariacoes(p) {
  return (p.tamanhos && p.tamanhos.length > 0) || (p.cores && p.cores.length > 0);
}

// ─── Filtros ──────────────────────────────────
function popularFiltros() {
  const cats = valoresUnicos(todosProdutos.map((p) => p.categoria));
  const subs = valoresUnicos(todosProdutos.map((p) => p.subcategoria));
  const tipos = valoresUnicos(todosProdutos.map((p) => p.tipo));
  adicionarOpcoes(selCat, cats, 'Todas as categorias');
  adicionarOpcoes(selSub, subs, 'Todas as subcategorias');
  adicionarOpcoes(selTipo, tipos, 'Todos os tipos');
}
function adicionarOpcoes(select, valores, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  valores.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = capitalizar(v);
    select.appendChild(opt);
  });
}

function renderizarProdutos() {
  const filtrados = todosProdutos.filter(
    (p) =>
      (!filtroAtual.categoria || p.categoria === filtroAtual.categoria) &&
      (!filtroAtual.subcategoria || p.subcategoria === filtroAtual.subcategoria) &&
      (!filtroAtual.tipo || p.tipo === filtroAtual.tipo)
  );

  infEl.textContent = `${filtrados.length} produto${
    filtrados.length !== 1 ? 's' : ''
  } encontrado${filtrados.length !== 1 ? 's' : ''}`;

  if (filtrados.length === 0) {
    gradeEl.innerHTML = `<div class="vazio"><div class="emoji">🎭</div><p>Nenhum produto encontrado com esses filtros.</p></div>`;
    return;
  }

  gradeEl.innerHTML = '';
  filtrados.forEach((produto) => gradeEl.appendChild(criarCardProduto(produto)));
}

function criarCardProduto(produto) {
  const card = document.createElement('div');
  card.className = 'card-produto';
  const temVar = temVariacoes(produto);
  card.innerHTML = `
    <div class="imagem-wrapper">
      <img src="${escapeHtml(produto.imagem)}" alt="${escapeHtml(produto.nome)}"
           loading="lazy" width="400" height="400"
           onerror="this.src='https://via.placeholder.com/400x400/1565C0/FFFFFF?text=Sem+Imagem'" />
    </div>
    <span class="badge-categoria ${normalizarCss(produto.categoria)}">${capitalizar(
    produto.categoria
  )}</span>
    <div class="card-corpo">
      <h3>${escapeHtml(produto.nome)}</h3>
      <div class="card-meta">
        <span class="tag">${capitalizar(produto.subcategoria)}</span>
        <span class="tag">${capitalizar(produto.tipo)}</span>
      </div>
      <div class="card-preco"><small>R$</small> ${formatarPreco(produto.preco)}</div>
    </div>
    <button class="btn-adicionar${temVar ? ' tem-opcoes' : ''}" data-id="${produto.id}" type="button">
      🛒 ${temVar ? 'Escolher Opções' : 'Adicionar ao Carrinho'}
    </button>`;

  card.querySelector('.btn-adicionar').addEventListener('click', () => {
    if (temVar) abrirModalProduto(produto);
    else adicionarAoCarrinho(produto);
  });
  return card;
}

function limparFiltros() {
  filtroAtual = { categoria: '', subcategoria: '', tipo: '' };
  selCat.value = '';
  selSub.value = '';
  selTipo.value = '';
  renderizarProdutos();
}

// ─── Carrinho (localStorage) ──────────────────
const CHAVE = 'palhacaria_carrinho';
function lerCarrinho() {
  try {
    const carrinho = JSON.parse(localStorage.getItem(CHAVE) || '[]');
    carrinho.forEach((item) => {
      if (!item.chave) item.chave = gerarChaveCarrinho(item.id, item.tamanho, item.cor);
    });
    return carrinho;
  } catch {
    return [];
  }
}
function salvarCarrinho(carrinho) {
  localStorage.setItem(CHAVE, JSON.stringify(carrinho));
}
function gerarChaveCarrinho(id, tamanho, cor) {
  return `${id}|${tamanho || ''}|${cor || ''}`;
}

function adicionarAoCarrinho(produto, tamanho = null, cor = null) {
  const carrinho = lerCarrinho();
  const chave = gerarChaveCarrinho(produto.id, tamanho, cor);
  const idx = carrinho.findIndex((i) => i.chave === chave);
  if (idx >= 0) carrinho[idx].quantidade++;
  else
    carrinho.push({
      chave,
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem,
      tamanho: tamanho || null,
      cor: cor || null,
      quantidade: 1,
    });
  salvarCarrinho(carrinho);
  atualizarCarrinhoUI();
  mostrarToast(`✅ "${produto.nome}" adicionado!`);
  animarContador();
}

function alterarQuantidade(chave, delta) {
  const carrinho = lerCarrinho();
  const idx = carrinho.findIndex((i) => i.chave === chave);
  if (idx < 0) return;
  carrinho[idx].quantidade += delta;
  if (carrinho[idx].quantidade <= 0) carrinho.splice(idx, 1);
  salvarCarrinho(carrinho);
  atualizarCarrinhoUI();
}
function removerItem(chave) {
  const carrinho = lerCarrinho().filter((i) => i.chave !== chave);
  salvarCarrinho(carrinho);
  atualizarCarrinhoUI();
}

function atualizarCarrinhoUI() {
  const carrinho = lerCarrinho();
  const totalItens = carrinho.reduce((s, i) => s + i.quantidade, 0);
  const totalValor = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);

  contador.textContent = String(totalItens);
  contador.style.display = totalItens > 0 ? 'flex' : 'none';
  btnWpp.disabled = totalItens === 0;

  if (carrinho.length === 0) {
    listaCarrinho.innerHTML = `<div class="carrinho-vazio"><div class="emoji">🛒</div><p>Seu carrinho está vazio.<br>Adicione produtos para continuar!</p></div>`;
  } else {
    listaCarrinho.innerHTML = '';
    carrinho.forEach((item) => listaCarrinho.appendChild(criarItemCarrinho(item)));
  }
  totalGeralEl.textContent = `R$ ${formatarPreco(totalValor)}`;
}

function criarItemCarrinho(item) {
  const div = document.createElement('div');
  div.className = 'item-carrinho';
  const variacao = item.tamanho || item.cor;
  div.innerHTML = `
    <img src="${escapeHtml(item.imagem)}" alt="${escapeHtml(item.nome)}"
         onerror="this.src='https://via.placeholder.com/60x60/1565C0/FFFFFF?text=?'" />
    <div class="item-info">
      <strong title="${escapeHtml(item.nome)}">${escapeHtml(item.nome)}</strong>
      ${
        variacao
          ? `<span class="variacao">${
              item.tamanho ? `Tam: ${item.tamanho}` : ''
            }${item.tamanho && item.cor ? ' · ' : ''}${
              item.cor ? `Cor: ${item.cor}` : ''
            }</span>`
          : ''
      }
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
    </div>`;
  div.querySelector('.btn-menos').addEventListener('click', () => alterarQuantidade(item.chave, -1));
  div.querySelector('.btn-mais').addEventListener('click', () => alterarQuantidade(item.chave, +1));
  div.querySelector('.btn-remover').addEventListener('click', () => removerItem(item.chave));
  return div;
}

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

// ─── Modal de tamanho/cor ─────────────────────
function abrirModalProduto(produto) {
  produtoModalAtual = produto;
  tamanhoSelecionado = null;
  corSelecionada = null;
  modalAvisoEl.textContent = '';

  modalImagemEl.src = produto.imagem;
  modalImagemEl.alt = produto.nome;
  modalTituloEl.textContent = produto.nome;
  modalPrecoEl.textContent = formatarPreco(produto.preco);

  const temTamanhos = produto.tamanhos && produto.tamanhos.length > 0;
  blocoTamanho.classList.toggle('visivel', temTamanhos);
  if (temTamanhos) {
    listaTamanhosEl.innerHTML = produto.tamanhos
      .map((t) => `<button type="button" class="opcao-tamanho" data-tamanho="${t}">${t}</button>`)
      .join('');
    listaTamanhosEl.querySelectorAll('.opcao-tamanho').forEach((btn) => {
      btn.addEventListener('click', () => {
        listaTamanhosEl.querySelectorAll('.opcao-tamanho').forEach((b) => b.classList.remove('selecionado'));
        btn.classList.add('selecionado');
        tamanhoSelecionado = btn.dataset.tamanho || null;
        modalAvisoEl.textContent = '';
      });
    });
  }

  const temCores = produto.cores && produto.cores.length > 0;
  blocoCor.classList.toggle('visivel', temCores);
  if (temCores) {
    listaCoresEl.innerHTML = produto.cores
      .map(
        (c) =>
          `<button type="button" class="opcao-cor" data-cor="${escapeHtml(
            c.nome
          )}" style="background:${c.hex}" title="${escapeHtml(c.nome)}" aria-label="${escapeHtml(
            c.nome
          )}"></button>`
      )
      .join('');
    listaCoresEl.querySelectorAll('.opcao-cor').forEach((btn) => {
      btn.addEventListener('click', () => {
        listaCoresEl.querySelectorAll('.opcao-cor').forEach((b) => b.classList.remove('selecionado'));
        btn.classList.add('selecionado');
        corSelecionada = btn.dataset.cor || null;
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
  const precisaTamanho = produtoModalAtual.tamanhos && produtoModalAtual.tamanhos.length > 0;
  const precisaCor = produtoModalAtual.cores && produtoModalAtual.cores.length > 0;
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

// ─── WhatsApp ─────────────────────────────────
const TELEFONE = '551636336445';
function finalizarPedido() {
  const carrinho = lerCarrinho();
  if (carrinho.length === 0) return;
  const cep = inputCEP.value.trim() || 'Não informado';
  const total = carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);
  const linhas = carrinho
    .map((i) => {
      const sub = formatarPreco(i.preco * i.quantidade);
      const variacao = i.tamanho || i.cor
        ? ` [${i.tamanho ? `Tam: ${i.tamanho}` : ''}${
            i.tamanho && i.cor ? ' | ' : ''
          }${i.cor ? `Cor: ${i.cor}` : ''}]`
        : '';
      return `• ${i.nome}${variacao} (${i.quantidade}x) — R$ ${sub}`;
    })
    .join('\n');
  const mensagem =
    ` *Palhaçaria & Cia — Novo Pedido* \n\n` +
    ` *Produtos selecionados:*\n${linhas}\n\n` +
    ` *Total: R$ ${formatarPreco(total)}*\n\n` +
    ` *CEP para entrega:* ${cep}\n *Frete a combinar*\n\n` +
    `Olá! Gostaria de fazer esse pedido. Aguardo confirmação! `;
  window.open(`https://wa.me/${TELEFONE}?text=${encodeURIComponent(mensagem)}`, '_blank');
}

// ─── Carrossel ────────────────────────────────
function iniciarCarrossel() {
  if (!bannerSecao) return;
  const slidesEl = bannerSecao.querySelector('.banner-slides');
  const indicadoresEl = bannerSecao.querySelector('.banner-indicadores');
  const btnPrev = bannerSecao.querySelector('.banner-seta-prev');
  const btnNext = bannerSecao.querySelector('.banner-seta-next');
  const imagens = Array.from(slidesEl.querySelectorAll('.banner-slide'));
  if (imagens.length === 0) return;

  let atual = 0;
  let timer = null;
  const intervalo = Number(bannerSecao.getAttribute('data-intervalo')) || 4500;

  const mostrarControles = imagens.length > 1;
  btnPrev.style.display = mostrarControles ? 'flex' : 'none';
  btnNext.style.display = mostrarControles ? 'flex' : 'none';

  if (mostrarControles) {
    indicadoresEl.innerHTML = imagens
      .map(
        (_, i) =>
          `<button class="banner-ponto${i === 0 ? ' ativo' : ''}" aria-label="Ir para imagem ${
            i + 1
          }" role="tab"></button>`
      )
      .join('');
  }
  const pontoEls = Array.from(indicadoresEl.querySelectorAll('.banner-ponto'));

  function irPara(indice) {
    imagens[atual].classList.remove('ativo');
    if (pontoEls[atual]) pontoEls[atual].classList.remove('ativo');
    atual = (indice + imagens.length) % imagens.length;
    imagens[atual].classList.add('ativo');
    if (pontoEls[atual]) pontoEls[atual].classList.add('ativo');
  }
  function proximo() {
    irPara(atual + 1);
  }
  function anterior() {
    irPara(atual - 1);
  }
  function iniciarAutoplay() {
    if (!mostrarControles) return;
    parar();
    timer = setInterval(proximo, intervalo);
  }
  function parar() {
    clearInterval(timer);
  }

  btnNext.addEventListener('click', () => {
    proximo();
    iniciarAutoplay();
  });
  btnPrev.addEventListener('click', () => {
    anterior();
    iniciarAutoplay();
  });
  pontoEls.forEach((ponto, i) =>
    ponto.addEventListener('click', () => {
      irPara(i);
      iniciarAutoplay();
    })
  );
  bannerSecao.addEventListener('mouseenter', parar);
  bannerSecao.addEventListener('mouseleave', iniciarAutoplay);
  iniciarAutoplay();
}

// ─── Toast ────────────────────────────────────
let toastTimer;
function mostrarToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('visivel');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('visivel'), 2500);
}
function animarContador() {
  contador.classList.remove('bounce');
  void contador.offsetWidth;
  contador.classList.add('bounce');
}

// ─── Init ─────────────────────────────────────
function init() {
  popularFiltros();
  renderizarProdutos();
  atualizarCarrinhoUI();
  iniciarCarrossel();

  selCat.addEventListener('change', (e) => {
    filtroAtual.categoria = e.target.value;
    renderizarProdutos();
  });
  selSub.addEventListener('change', (e) => {
    filtroAtual.subcategoria = e.target.value;
    renderizarProdutos();
  });
  selTipo.addEventListener('change', (e) => {
    filtroAtual.tipo = e.target.value;
    renderizarProdutos();
  });
  btnLimpar.addEventListener('click', limparFiltros);

  // Links de categoria no rodapé
  document
    .querySelectorAll(
      '#rodape-links-categorias a[data-filtro-cat], #rodape-links-categorias a[data-filtro-sub], #rodape-links-categorias a[data-filtro-tipo]'
    )
    .forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const el = a;
        filtroAtual = {
          categoria: el.dataset.filtroCat || '',
          subcategoria: el.dataset.filtroSub || '',
          tipo: el.dataset.filtroTipo || '',
        };
        selCat.value = filtroAtual.categoria;
        selSub.value = filtroAtual.subcategoria;
        selTipo.value = filtroAtual.tipo;
        renderizarProdutos();
        document.getElementById('grade-produtos').scrollIntoView({ behavior: 'smooth' });
      });
    });

  document.querySelectorAll('[data-limpar-filtros]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      limparFiltros();
    })
  );
  document.querySelectorAll('[data-abrir-carrinho]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      abrirCarrinho();
    })
  );

  btnAbrir.addEventListener('click', abrirCarrinho);
  btnFechar.addEventListener('click', fecharCarrinho);
  overlay.addEventListener('click', fecharCarrinho);

  btnWpp.addEventListener('click', finalizarPedido);

  btnFecharModal.addEventListener('click', fecharModalProduto);
  modalOverlay.addEventListener('click', fecharModalProduto);
  btnConfirmarOpcoes.addEventListener('click', confirmarOpcoesProduto);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharModalProduto();
  });

  // Máscara CEP
  inputCEP.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 8);
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
    e.target.value = v;
  });
}

document.addEventListener('DOMContentLoaded', init);
