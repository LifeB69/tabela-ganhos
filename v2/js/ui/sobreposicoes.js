// Tabela de Ganhos v2 — folha (de baixo), diálogo de confirmação e toast com "desfazer".
import { h, anexar } from './el.js';
import { botao } from './basicos.js';

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/**
 * Abre uma folha (sobe de baixo no celular; janela no computador) ou um diálogo central.
 * Acessível: <dialog> modal (role=dialog), título ligado por aria-labelledby, foco preso dentro,
 * Esc fecha, toque fora fecha (só na folha), o foco volta para quem abriu.
 * @param {{ titulo: string, conteudo?: Node|Node[]|((fechar) => Node|Node[]), tipo?: 'folha'|'dialogo',
 *           acoes?: Array<{ texto, variante?, valor?, aoClicar?: (fechar) => (void|false|Promise) }>,
 *           aoFechar?: (valor) => void, rotuloFechar?: string }} opcoes
 *   Cada ação fecha a folha com o seu `valor`, a não ser que aoClicar devolva false.
 * @returns {{ elemento: HTMLDialogElement, corpo: HTMLElement, fechar: (valor?) => void, fechado: Promise<any> }}
 */
export function folha({ titulo, conteudo = null, tipo = 'folha', acoes = [], aoFechar = null, rotuloFechar = 'Fechar' } = {}) {
  const anterior = document.activeElement;
  const idTitulo = `folha-titulo-${Date.now().toString(36)}`;
  let resolver;
  const fechado = new Promise((ok) => { resolver = ok; });
  let jaFechou = false;

  const corpo = h('div', { class: 'folha-corpo' });
  const dlg = h('dialog', { class: ['folha', tipo === 'dialogo' && 'folha--dialogo'], 'aria-labelledby': idTitulo });

  const fechar = (valor = null) => {
    if (jaFechou) return;
    jaFechou = true;
    try { dlg.close(); } catch { /* já fechado */ }
    dlg.remove();
    document.documentElement.classList.remove('folha-aberta');
    if (anterior && typeof anterior.focus === 'function' && document.contains(anterior)) anterior.focus();
    if (aoFechar) aoFechar(valor);
    resolver(valor);
  };

  const cab = h('div', { class: 'folha-cab' },
    h('h2', { class: 'folha-titulo', id: idTitulo }, titulo),
    tipo === 'folha' ? botao({ variante: 'icone', icone: 'fechar', rotulo: rotuloFechar, aoClicar: () => fechar(null), classe: 'botao--texto' }) : null);
  const conteudoFinal = typeof conteudo === 'function' ? conteudo(fechar) : conteudo;
  if (conteudoFinal) anexar(corpo, [conteudoFinal]);
  const rodape = acoes.length ? h('div', { class: 'folha-acoes' }, acoes.map((a) => botao({
    texto: a.texto, variante: a.variante || 'secundario',
    aoClicar: async () => {
      if (a.aoClicar) { const r = await a.aoClicar(fechar); if (r === false) return; }
      fechar(a.valor ?? null);
    },
  }))) : null;
  anexar(dlg, [cab, corpo, rodape]);

  dlg.addEventListener('cancel', (e) => { e.preventDefault(); fechar(null); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg && tipo === 'folha') fechar(null); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const itens = [...dlg.querySelectorAll(FOCAVEIS)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!itens.length) return;
    const primeiro = itens[0];
    const ultimo = itens[itens.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  });

  document.body.appendChild(dlg);
  document.documentElement.classList.add('folha-aberta');
  try { dlg.showModal(); } catch { dlg.setAttribute('open', ''); }
  // Foco: primeiro campo do corpo; senão a primeira ação; senão o título.
  const alvo = corpo.querySelector('input, select, textarea') || (rodape && rodape.querySelector('button')) || cab.querySelector('button');
  if (alvo) alvo.focus(); else { cab.firstChild.setAttribute('tabindex', '-1'); cab.firstChild.focus(); }
  return { elemento: dlg, corpo, fechar, fechado };
}

/**
 * Pergunta sim/não. Ex.: if (await confirmar({ titulo: 'Apagar tudo?', texto: '…', confirmar: 'Apagar', perigo: true })) …
 * @returns {Promise<boolean>}
 */
export async function confirmar({ titulo, texto = null, confirmar: rotuloSim = 'Confirmar', cancelar = 'Cancelar', perigo = false } = {}) {
  const f = folha({
    titulo, tipo: 'dialogo',
    conteudo: texto ? h('p', null, texto) : null,
    acoes: [
      { texto: cancelar, variante: 'secundario', valor: false },
      { texto: rotuloSim, variante: perigo ? 'perigo' : 'primario', valor: true },
    ],
  });
  return (await f.fechado) === true;
}

// ───────────── Toast ─────────────
/**
 * Mensagem curta embaixo da tela. Com `desfazer`, mostra o botão "Desfazer" e fica mais tempo.
 * @param {string} mensagem
 * @param {{ desfazer?: () => (void|Promise), duracao?: number, rotuloDesfazer?: string }} opcoes
 * @returns {{ fechar: () => void }}
 */
export function toast(mensagem, { desfazer = null, duracao = null, rotuloDesfazer = 'Desfazer' } = {}) {
  const area = document.getElementById('toasts');
  if (!area) return { fechar() {} };
  while (area.children.length >= 2) area.firstElementChild.remove();
  let timer = null;
  const el = h('div', { class: 'toast' }, h('p', { class: 'toast-texto' }, mensagem));
  const fechar = () => { clearTimeout(timer); el.remove(); };
  if (desfazer) {
    el.append(botao({
      texto: rotuloDesfazer,
      aoClicar: async () => { fechar(); try { await desfazer(); } catch { toast('Não deu para desfazer.'); } },
    }));
  }
  el.append(botao({ variante: 'icone', icone: 'fechar', rotulo: 'Fechar aviso', aoClicar: fechar }));
  const tempo = duracao ?? (desfazer ? 8000 : 4500);
  const iniciar = () => { clearTimeout(timer); timer = setTimeout(fechar, tempo); };
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', iniciar);
  el.addEventListener('focusin', () => clearTimeout(timer));
  el.addEventListener('focusout', iniciar);
  area.append(el);
  iniciar();
  return { fechar };
}

