// Tabela de Ganhos v2 — inicialização, preferências, roteador por hash e contexto das telas.
// As telas ficam em js/telas/<nome>.js e são importadas sob demanda. Contrato: docs/ARQUITETURA-UI.md.
import * as motor from './motor/index.js';
import * as ui from './ui/index.js';
import { armazem } from './dados/armazem.js';
import {
  CONFIG_PADRAO, OPCOES, NOMES, VERSAO_APP, normalizarConfig, mesclarConfig, copiar, dataReferenciaDe, centavosArredondamento, hojeISO,
} from './dados/config.js';
import { gerarLink, lerLink, textoWhatsApp, linkWhatsApp, copiar as copiarTexto, compartilharNativo } from './compartilhar.js';

export const TELAS = Object.freeze({ calcular: 'Calcular', tabela: 'Tabela', salvos: 'Salvos', leis: 'Leis', mais: 'Mais' });
const TELA_INICIAL = 'calcular';
const APARENCIA = ['visual', 'tema', 'letra', 'contraste', 'movimento'];
const raizDoc = document.documentElement;
const main = document.getElementById('tela');

const estado = {
  config: normalizarConfig(CONFIG_PADRAO),
  rota: null,
  atual: { tela: null, modulo: null, raiz: null },
  contador: 0,
  // Enquanto a config guardada não foi lida, nada é gravado: a provisória (padrão) apagaria a verdadeira.
  configCarregada: false,
  pendentes: [],         // alterações feitas antes da leitura (aplicadas por cima da config lida)
};

// ───────────── Preferências de aparência ─────────────
/** Valores passados na querystring (?visual=c&tema=escuro…) para testes: valem só nesta abertura. */
function aparenciaDaQuery() {
  const q = {};
  try {
    const p = new URLSearchParams(location.search);
    for (const k of APARENCIA) if (p.has(k) && OPCOES[k].includes(p.get(k))) q[k] = p.get(k);
  } catch { /* nada */ }
  return q;
}
const QUERY = aparenciaDaQuery();

function temaEscuroAtivo() {
  const tema = raizDoc.getAttribute('data-tema');
  if (tema === 'escuro') return true;
  if (tema === 'claro') return false;
  return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
}

function aplicarPreferencias(cfg) {
  for (const k of APARENCIA) raizDoc.setAttribute(`data-${k}`, QUERY[k] || cfg[k]);
  atualizarCorDoNavegador();
  atualizarBotaoTema();
}

function atualizarCorDoNavegador() {
  const cor = getComputedStyle(raizDoc).getPropertyValue('--cor-topo').trim();
  if (!cor) return;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m, i) => { if (i > 0) m.remove(); });
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
  meta.removeAttribute('media');
  meta.setAttribute('content', cor);
}

function atualizarBotaoTema() {
  const b = document.getElementById('botao-tema');
  if (!b) return;
  const escuro = temaEscuroAtivo();
  b.setAttribute('aria-label', escuro ? 'Trocar para o tema claro' : 'Trocar para o tema escuro');
  b.replaceChildren(ui.icone(escuro ? 'sol' : 'lua'));
}

// ───────────── Configuração ─────────────
async function salvarConfig(parcial) {
  const antes = estado.config;
  const novo = mesclarConfig(antes, parcial);
  estado.config = novo;
  aplicarPreferencias(novo);
  if (estado.configCarregada) {
    try { await armazem.salvarConfig(novo); } catch (e) { ui.toast(e.message || 'Não deu para guardar as configurações.'); }
  } else estado.pendentes.push(copiar(parcial));
  const mudou = Object.keys(novo).filter((k) => JSON.stringify(novo[k]) !== JSON.stringify(antes[k]));
  window.dispatchEvent(new CustomEvent('tg:config', { detail: { config: copiar(novo), mudou } }));
  return copiar(novo);
}

// ───────────── Contexto das telas ─────────────
const ctx = Object.freeze({
  /** Cópia da configuração atual (mudar a cópia não muda nada; use salvarConfig). */
  get config() { return copiar(estado.config); },
  /** Mescla e grava uma alteração parcial. Aplica a aparência na hora. Dispara o evento 'tg:config'. */
  salvarConfig,
  /** Rota atual: { tela, sub, params, compartilhado, hash }. */
  get rota() { return estado.rota; },
  armazem,
  motor,
  ui,
  navegar,
  toast: (mensagem, opcoes) => ui.toast(mensagem, opcoes),
  anunciar: (mensagem) => ui.anunciar(mensagem),
  carregarCss: (href) => ui.carregarCss(href),
  /** Data dos cálculos (AAAA-MM-DD): hoje, ou a data escolhida em Configurações. */
  dataReferencia: () => dataReferenciaDe(estado.config),
  hoje: () => hojeISO(),
  /** Arredondamento escolhido, em centavos, para passar ao motor (0 = nenhum). */
  arredondamentoCentavos: () => centavosArredondamento(estado.config),
  /** Overrides do motor (valores editados à mão em Configurações), prontos para { overrides }. */
  overrides: () => copiar(estado.config.overrides),
  nomes: NOMES,
  /** Versão do app (a mesma do cache do sw.js). */
  versaoApp: VERSAO_APP,
  compartilhar: Object.freeze({ gerarLink, lerLink, textoWhatsApp, linkWhatsApp, copiar: copiarTexto, compartilharNativo }),
});

// ───────────── Roteador ─────────────
const SUB_OK = /^[a-z0-9-]{1,40}(\/[a-z0-9-]{1,40}){0,3}$/;

/** Lê o hash: '' -> calcular; '#leis/glossario?x=1' -> { tela:'leis', sub:'glossario', params }; '#c=…' -> link compartilhado. */
export function lerRota(hash) {
  const bruto = (hash || '').replace(/^#/, '');
  if (bruto.startsWith('c=')) {
    return { tela: 'calcular', sub: null, params: new URLSearchParams(), compartilhado: lerLink(`#${bruto}`), hash: `#${bruto}` };
  }
  const [caminho, query = ''] = bruto.split('?');
  const [tela, ...resto] = caminho.split('/');
  const conhecida = Object.prototype.hasOwnProperty.call(TELAS, tela);
  const sub = resto.join('/');
  let params;
  try { params = new URLSearchParams(query); } catch { params = new URLSearchParams(); }
  return {
    tela: conhecida ? tela : TELA_INICIAL,
    sub: conhecida && SUB_OK.test(sub) ? sub : null,
    params,
    compartilhado: null,
    hash: bruto ? `#${bruto}` : '',
    desconhecida: !!tela && !conhecida,
  };
}

/**
 * Vai para outra tela/sub-rota. navegar('#leis/glossario'); navegar('#calcular', { substituir: true })
 * substituir: troca a entrada do histórico (o botão voltar não volta para a anterior).
 */
function navegar(hash, { substituir = false } = {}) {
  const alvo = hash.startsWith('#') ? hash : `#${hash}`;
  if (substituir) { history.replaceState(history.state, '', alvo); rotear(); return; }
  if (location.hash === alvo) rotear();
  else location.hash = alvo;
}

function fecharSobreposicoes() {
  document.querySelectorAll('dialog.folha').forEach((d) => d.dispatchEvent(new Event('cancel', { cancelable: true })));
}

function marcarAba(tela) {
  document.querySelectorAll('.aba[data-aba]').forEach((a) => {
    if (a.dataset.aba === tela) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

/** porRede: o arquivo da tela não chegou (internet). Senão, a tela falhou ao montar com os dados deste aparelho. */
function telaDeErro(tela, recarregar, { porRede = true } = {}) {
  return [
    ui.cabecalhoTela({ titulo: TELAS[tela] || 'Tela' }),
    ui.estadoVazio({
      titulo: 'Não deu para abrir esta tela',
      texto: porRede
        ? 'Confira a internet e tente de novo. Se o app estiver instalado, ele funciona sem internet depois da primeira abertura.'
        : 'Algum dado guardado neste aparelho atrapalhou a tela. Tente de novo. Se continuar, em Mais, toque em "Voltar tudo ao oficial" ou restaure um backup.',
      icone: 'atencao',
      acao: { texto: 'Tentar de novo', aoClicar: recarregar },
    }),
  ];
}

async function rotear({ primeira = false } = {}) {
  const rota = lerRota(location.hash);
  estado.rota = rota;
  const token = ++estado.contador;
  fecharSobreposicoes();
  marcarAba(rota.tela);
  const { atual } = estado;

  // Mesma tela e ela sabe trocar de sub-rota sozinha: não remonta.
  if (atual.modulo && atual.tela === rota.tela && !rota.compartilhado && typeof atual.modulo.aoMudarRota === 'function') {
    try { await atual.modulo.aoMudarRota(rota, ctx); } catch (e) { console.error(e); }
    return;
  }

  if (atual.modulo && typeof atual.modulo.desmontar === 'function') {
    try { await atual.modulo.desmontar(); } catch (e) { console.error(e); }
  }
  estado.atual = { tela: null, modulo: null, raiz: null };

  const raiz = ui.h('div', { class: 'tela-raiz', dataset: { tela: rota.tela } });
  let modulo;
  try {
    modulo = await import(`./telas/${rota.tela}.js`);
  } catch (e) {
    console.error(e);
    if (token !== estado.contador) return;
    ui.trocar(raiz, telaDeErro(rota.tela, () => rotear()));
    main.replaceChildren(raiz);
    focarTitulo(raiz, primeira);
    return;
  }
  if (token !== estado.contador) return;

  main.replaceChildren(raiz);
  try {
    await modulo.montar(raiz, ctx);
  } catch (e) {
    console.error(e);
    ui.trocar(raiz, telaDeErro(rota.tela, () => rotear(), { porRede: false }));
  }
  if (token !== estado.contador) {
    if (typeof modulo.desmontar === 'function') { try { await modulo.desmontar(); } catch (e) { console.error(e); } }
    return;
  }
  estado.atual = { tela: rota.tela, modulo, raiz };
  document.title = rota.tela === TELA_INICIAL && primeira ? 'Tabela de Ganhos' : `${TELAS[rota.tela]} · Tabela de Ganhos`;
  if (!primeira) window.scrollTo(0, 0);
  focarTitulo(raiz, primeira);
}

function focarTitulo(raiz, primeira) {
  if (primeira) return;   // na abertura do app o foco fica no começo da página
  const titulo = raiz.querySelector('[data-titulo-tela]') || raiz.querySelector('h1');
  const nome = TELAS[estado.rota.tela];
  if (titulo) {
    if (!titulo.hasAttribute('tabindex')) titulo.setAttribute('tabindex', '-1');
    titulo.focus({ preventScroll: true });
  } else main.focus({ preventScroll: true });
  ui.anunciar(`Tela ${nome}`);
}

// ───────────── Casca: cabeçalho, impressão, offline ─────────────
function preencherSelo() {
  const iso = motor.DATA_CONFERENCIA;
  const [a, m, d] = iso.split('-');
  const t = document.querySelector('[data-data-conferencia]');
  if (t) { t.textContent = `${d}/${m}/${a}`; t.setAttribute('datetime', iso); }
  const ano = document.querySelector('[data-ano-valores]');
  if (ano) ano.textContent = a;
}

function ligarCasca() {
  document.getElementById('botao-tema')?.addEventListener('click', () => {
    const proximo = temaEscuroAtivo() ? 'claro' : 'escuro';
    delete QUERY.tema;   // o toque da pessoa vence o ?tema= de teste
    salvarConfig({ tema: proximo });
  });
  try {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { atualizarCorDoNavegador(); atualizarBotaoTema(); });
  } catch { /* navegador antigo */ }
  // "Pular para o conteúdo" sem mexer no hash (o hash é do roteador).
  document.querySelector('.pular')?.addEventListener('click', (e) => { e.preventDefault(); main.focus(); });
  // Impressão: abre todos os "mostrar a conta" e fecha de novo depois.
  const abertosPorImpressao = [];
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('details:not([open])').forEach((d) => { d.open = true; abertosPorImpressao.push(d); });
  });
  window.addEventListener('afterprint', () => { abertosPorImpressao.splice(0).forEach((d) => { d.open = false; }); });
  window.addEventListener('hashchange', () => rotear());
}

// Endereços onde o navegador aceita service worker sem https (teste local).
const HOSTS_LOCAIS = ['localhost', '127.0.0.1', '[::1]'];

function registrarOffline() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && !HOSTS_LOCAIS.includes(location.hostname)) return;
  // Havia um service worker cuidando desta página? Se não, é a primeira visita: nada de "nova versão".
  const tinhaControle = !!navigator.serviceWorker.controller;
  let avisado = false;
  navigator.serviceWorker.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || d.tipo !== 'sw-ativo' || !tinhaControle || avisado) return;
    if (d.versao === VERSAO_APP) return;   // esta página já é da versão nova
    avisado = true;
    avisarNovaVersao();
  });
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

/** "Nova versão disponível · Atualizar": fica na tela até a pessoa tocar (não some sozinho). */
function avisarNovaVersao() {
  ui.toast('Nova versão disponível.', { desfazer: () => location.reload(), rotuloDesfazer: 'Atualizar', duracao: 24 * 3600 * 1000 });
}

/** O Chrome oferece a instalação cedo; guardamos o evento para a tela Mais (botão "Instalar o app"). */
function guardarInstalacao() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.tgEventoInstalar = e;
    window.dispatchEvent(new Event('tg:instalavel'));
  });
}

/** Config provisória: padrão + a aparência que o pre-tema.js já aplicou (vinda do espelho). */
function configDaPagina() {
  const parcial = {};
  for (const k of APARENCIA) if (!QUERY[k]) parcial[k] = raizDoc.getAttribute(`data-${k}`);
  return mesclarConfig(CONFIG_PADRAO, parcial);
}

async function iniciar() {
  preencherSelo();
  ligarCasca();
  guardarInstalacao();
  registrarOffline();
  // O armazenamento costuma responder em milissegundos. Se demorar (aparelho lento, outra aba
  // segurando a base), a tela abre com a aparência do espelho e a config chega depois pelo evento 'tg:config'.
  const carregando = armazem.iniciar().then(() => armazem.obterConfig()).catch((e) => { console.error(e); return null; });
  const cfg = await Promise.race([carregando, new Promise((ok) => { setTimeout(() => ok(undefined), 1200); })]);
  if (cfg) { estado.config = cfg; estado.configCarregada = true; } else {
    estado.config = configDaPagina();
    carregando.then(async (tarde) => {
      estado.configCarregada = true;
      const pendentes = estado.pendentes.splice(0);
      if (!tarde) {
        // Sem armazenamento: fica com a provisória; tenta gravar o que a pessoa mudou.
        if (pendentes.length) armazem.salvarConfig(estado.config).catch(() => {});
        return;
      }
      // O que a pessoa mudou nesse meio-tempo vale por cima da config lida. A lembrança da calculadora
      // ('calcular') feita com a config provisória não entra: ela apagaria o estado guardado de verdade.
      let novo = tarde;
      for (const p of pendentes) {
        const { calcular, ...resto } = p;   // eslint-disable-line no-unused-vars
        if (Object.keys(resto).length) novo = mesclarConfig(novo, resto);
      }
      estado.config = novo;
      if (novo !== tarde) { try { await armazem.salvarConfig(novo); } catch { /* fica na memória */ } }
      aplicarPreferencias(novo);
      // tarde: true avisa as telas que esta é a config guardada (a calculadora pode reabrir o que estava lembrado).
      window.dispatchEvent(new CustomEvent('tg:config', { detail: { config: copiar(novo), mudou: Object.keys(novo), tarde: true } }));
    });
  }
  aplicarPreferencias(estado.config);
  await rotear({ primeira: true });
  // Só para teste: ?verificar=1 roda as checagens de contraste, alvos e rolagem (testes/verificar-ui.js).
  if (new URLSearchParams(location.search).get('verificar') === '1') {
    import('../testes/verificar-ui.js').then((m) => setTimeout(() => m.verificar(), 200)).catch(() => {});
  }
}

iniciar();
