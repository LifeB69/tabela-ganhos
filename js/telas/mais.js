// Tabela de Ganhos v2 — tela "Mais" (Configurações, dados, instalar e sobre).
// Contrato: docs/ARQUITETURA-UI.md. Cada grupo fica em js/telas/mais/<grupo>.js.
// Sub-rotas: #mais/aparencia, #mais/local, #mais/padroes, #mais/arredondamento, #mais/tabela-legal,
// #mais/dados, #mais/instalar, #mais/sobre (rola até o grupo e põe o foco no título dele).
import { montarAparencia } from './mais/aparencia.js';
import { montarLocal, montarPadroes, montarArredondamento } from './mais/preferencias.js';
import { montarLegal } from './mais/legal.js';
import { montarDados, avisoPendente } from './mais/dados.js';
import { montarInstalar, montarSobre } from './mais/sobre.js';

const SECOES = [
  ['aparencia', 'Aparência'],
  ['local', 'Local'],
  ['padroes', 'Padrões'],
  ['arredondamento', 'Arredondamento'],
  ['tabela-legal', 'Tabela legal'],
  ['dados', 'Seus dados'],
  ['instalar', 'Instalar'],
  ['sobre', 'Sobre'],
];

let partes = [];
let ouvirConfig = null;

/** @param {HTMLElement} raiz  @param {object} ctx */
export async function montar(raiz, ctx) {
  const { ui } = ctx;
  const { h } = ui;
  await ctx.carregarCss('css/telas/mais.css');

  partes = [
    montarAparencia(ctx),
    montarLocal(ctx),
    montarPadroes(ctx),
    montarArredondamento(ctx),
    montarLegal(ctx),
    montarDados(ctx),
    montarInstalar(ctx),
    montarSobre(ctx),
  ];

  const indice = h('nav', { class: 'mais-indice', 'aria-label': 'Partes desta tela' },
    h('ul', { role: 'list' }, SECOES.map(([id, nome]) => h('li', null, h('a', { href: `#mais/${id}` }, nome)))));

  const avisoTemporario = ctx.armazem.temporario
    ? ui.alerta({ nivel: 'atencao', titulo: 'Este navegador não deixa guardar dados', texto: 'As configurações valem só até fechar esta janela. Numa janela anônima isso é normal.' })
    : null;

  raiz.append(
    h('section', { class: 'tela', 'aria-labelledby': 'titulo-tela' },
      ui.cabecalhoTela({ titulo: 'Mais', sub: 'Configurações, backup e informações do app.' }),
      avisoTemporario,
      indice,
      partes.map((p) => p.elemento)));

  // Config mudou em outro lugar (botão de tema do cabeçalho, config que chegou atrasada, backup restaurado).
  ouvirConfig = (e) => {
    const { config, mudou } = e.detail || {};
    if (!config) return;
    for (const p of partes) if (typeof p.atualizar === 'function') { try { p.atualizar(config, mudou); } catch (err) { console.error(err); } }
  };
  window.addEventListener('tg:config', ouvirConfig);

  const aviso = avisoPendente();
  if (aviso) ctx.toast(aviso);

  if (ctx.rota && ctx.rota.sub) irPara(raiz, ctx.rota.sub, { primeira: true });
}

/** Troca de sub-rota sem remontar: rola até o grupo pedido. */
export async function aoMudarRota(rota) {
  const raiz = document.querySelector('[data-tela="mais"]');
  if (!raiz) return;
  if (rota.sub) irPara(raiz, rota.sub);
  else {
    window.scrollTo(0, 0);
    const t = raiz.querySelector('[data-titulo-tela]');
    if (t) t.focus({ preventScroll: true });
  }
}

function irPara(raiz, sub, { primeira = false } = {}) {
  const id = String(sub).split('/')[0];
  const alvo = raiz.querySelector(`#mais-${CSS.escape(id)}`);
  if (!alvo) return;
  const titulo = alvo.querySelector('h2');
  const reduzido = document.documentElement.getAttribute('data-movimento') === 'reduzido'
    || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Na abertura direta (#mais/dados) o roteador ainda vai mexer no foco e na rolagem: espera um pouco.
  const fazer = () => {
    alvo.scrollIntoView({ behavior: reduzido || primeira ? 'auto' : 'smooth', block: 'start' });
    if (titulo) titulo.focus({ preventScroll: true });
  };
  if (primeira) setTimeout(fazer, 0); else fazer();
}

export function desmontar() {
  if (ouvirConfig) window.removeEventListener('tg:config', ouvirConfig);
  ouvirConfig = null;
  for (const p of partes) if (typeof p.desmontar === 'function') { try { p.desmontar(); } catch { /* nada */ } }
  partes = [];
}
