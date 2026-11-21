// Tabela de Ganhos v2 — componentes básicos: botão, cabeçalho de tela, estado vazio, tabela, anúncio, CSS de tela.
import { h, idUnico } from './el.js';
import { icone } from './icones.js';

/**
 * Botão. variante: 'primario' | 'secundario' (padrão) | 'texto' | 'perigo' | 'icone'.
 * Com variante 'icone', passe `rotulo` (vira aria-label) — o botão não tem texto visível.
 */
export function botao({ texto = '', icone: nomeIcone = null, variante = 'secundario', aoClicar = null, tipo = 'button', rotulo = null, largo = false, desativado = false, classe = null } = {}) {
  const classes = ['botao', variante !== 'secundario' ? `botao--${variante}` : '', largo ? 'botao--largo' : '', classe];
  return h('button', {
    type: tipo, class: classes, 'aria-label': rotulo, disabled: desativado,
    on: aoClicar ? { click: aoClicar } : null,
  }, nomeIcone ? icone(nomeIcone) : null, variante === 'icone' ? null : texto);
}

/**
 * Cabeçalho de toda tela. O h1 recebe o foco quando a pessoa troca de aba (o roteador faz isso).
 * @returns {HTMLElement} <header class="tela-cab">
 */
export function cabecalhoTela({ titulo, sub = null } = {}) {
  return h('header', { class: 'tela-cab' },
    h('h1', { class: 'tela-titulo', id: 'titulo-tela', tabindex: '-1', 'data-titulo-tela': true }, titulo),
    sub ? h('p', { class: 'tela-sub' }, sub) : null);
}

/** Estado vazio: ícone, título, texto e uma ação opcional ({ texto, aoClicar } ou { texto, href }). */
export function estadoVazio({ titulo, texto = null, icone: nomeIcone = 'vazio', acao = null } = {}) {
  let elAcao = null;
  if (acao && acao.href) elAcao = h('a', { class: 'botao', href: acao.href }, acao.texto);
  else if (acao) elAcao = botao({ texto: acao.texto, aoClicar: acao.aoClicar, variante: acao.variante || 'secundario' });
  return h('div', { class: 'vazio' },
    h('span', { class: 'vazio-icone' }, icone(nomeIcone, { tamanho: 'g' })),
    h('p', { class: 'vazio-titulo' }, h('strong', null, titulo)),
    texto ? h('p', { class: 'vazio-texto' }, texto) : null,
    elAcao);
}

/**
 * Tabela densa e acessível.
 * colunas: [{ rotulo, numerica?: bool, classe?: string }]
 * linhas: [[célula, ...]] — célula = texto | número | Node | { texto|no, classe?, rotulo? }
 * A 1ª célula de cada linha vira <th scope="row"> quando cabecalhoNaPrimeira = true.
 * empilhada: em telas < 480 px cada linha vira um cartão com o rótulo da coluna (data-rotulo).
 * @returns {HTMLElement} <div class="tabela-rolavel"> com a <table> dentro (rola na horizontal só ela, nunca o corpo).
 */
export function tabela({ legenda = null, colunas = [], linhas = [], cabecalhoNaPrimeira = true, fixarPrimeira = false, zebra = false, empilhada = false, classe = null } = {}) {
  const idLegenda = idUnico('tabela');
  const t = h('table', { class: ['tabela', fixarPrimeira && 'tabela--fixa-1', zebra && 'tabela--zebra', empilhada && 'tabela--empilhada', classe] },
    legenda ? h('caption', { id: idLegenda }, legenda) : null,
    h('thead', null, h('tr', null, colunas.map((c) => h('th', { scope: 'col', class: [c.numerica && 'num', c.classe] }, c.rotulo)))),
    h('tbody', null, linhas.map((linha) => h('tr', null, linha.map((cel, i) => {
      const col = colunas[i] || {};
      const obj = cel !== null && typeof cel === 'object' && !(cel instanceof Node) ? cel : { texto: cel };
      const conteudo = obj.no || (obj.texto ?? '');
      const atributos = { class: [col.numerica && 'num', col.classe, obj.classe], 'data-rotulo': empilhada ? (obj.rotulo || col.rotulo) : null };
      return i === 0 && cabecalhoNaPrimeira ? h('th', { scope: 'row', ...atributos }, conteudo) : h('td', atributos, conteudo);
    })))));
  // Região rolável com foco por teclado (para rolar com as setas) e nome para leitor de tela.
  return h('div', { class: 'tabela-rolavel', tabindex: '0', role: 'region', 'aria-labelledby': legenda ? idLegenda : null, 'aria-label': legenda ? null : 'Tabela' }, t);
}

/** Fala uma mensagem curta para leitor de tela (região viva da casca). Use com moderação. */
export function anunciar(mensagem) {
  const regiao = document.getElementById('anuncio');
  if (!regiao) return;
  regiao.textContent = '';
  setTimeout(() => { regiao.textContent = String(mensagem); }, 60);
}

const _cssCarregados = new Map();
/**
 * Carrega o CSS próprio de uma tela (uma vez só). Ex.: await carregarCss('css/telas/calcular.css')
 * Caminho relativo ao index.html. @returns {Promise<void>} (resolve mesmo se o arquivo faltar)
 */
export function carregarCss(href) {
  if (_cssCarregados.has(href)) return _cssCarregados.get(href);
  const p = new Promise((ok) => {
    const link = h('link', { rel: 'stylesheet', href, 'data-css-tela': href });
    link.addEventListener('load', () => ok(), { once: true });
    link.addEventListener('error', () => ok(), { once: true });
    // Antes do impressao.css, para a impressão continuar valendo por cima.
    const impressao = document.querySelector('link[media="print"]');
    if (impressao) impressao.before(link); else document.head.appendChild(link);
  });
  _cssCarregados.set(href, p);
  return p;
}
