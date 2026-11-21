// Tabela de Ganhos v2 — mostrar resultado: cartão de resultado, "mostrar a conta", alertas e selos.
// Recebem os objetos do motor (passos e alertas) do jeito que ele devolve (docs/MOTOR.md).
import { formatarBRL, porExtenso } from '../motor/index.js';
import { h, idUnico, linkExterno, trocar } from './el.js';
import { icone } from './icones.js';
import { botao } from './basicos.js';

// ───────────── Selos ─────────────
const SELOS = {
  previsto: { texto: 'Previsto', icone: 'previsto', classe: 'selo--previsto' },
  nao_verificado: { texto: 'Não verificado', icone: 'nao_verificado', classe: 'selo--nao-verificado' },
  editado: { texto: 'Editado por você', icone: 'editar', classe: 'selo--editado' },
  exemplo: { texto: 'Exemplo', icone: null, classe: 'selo--exemplo' },
  ok: { texto: 'Dentro da lei', icone: 'ok', classe: 'selo--ok' },
  info: { texto: 'Informação', icone: null, classe: 'selo--info' },
  risco: { texto: 'Risco', icone: 'risco', classe: 'selo--risco' },
};
export const TIPOS_SELO = Object.freeze(Object.keys(SELOS));

/**
 * Selo curto. tipo: 'previsto' | 'nao_verificado' | 'editado' | 'exemplo' | 'ok' | 'info' | 'risco'.
 * @param {string} tipo @param {string} [texto] troca o texto padrão
 */
export function selo(tipo, texto = null) {
  const s = SELOS[tipo] || SELOS.info;
  return h('span', { class: ['selo', s.classe] }, s.icone ? icone(s.icone, { tamanho: 'p' }) : null, texto || s.texto);
}

/** Selos de um passo/parâmetro do motor (status e editado_por_usuario). */
export function selosDoPasso(p) {
  const lista = [];
  if (p && p.status === 'previsto') lista.push(selo('previsto'));
  if (p && p.status === 'nao_verificado') lista.push(selo('nao_verificado'));
  if (p && p.editado_por_usuario) lista.push(selo('editado'));
  return lista;
}

/** Valor em reais para ler na tela: "1.621,00", com "R$" só para leitor de tela. */
function valorSemSimbolo(centavos) {
  return [h('span', { class: 'sr' }, 'R$ '), formatarBRL(centavos, { simbolo: false })];
}

// ───────────── Cartão de resultado ─────────────
/**
 * Cartão do resultado principal ("Você paga por mês").
 * @param {{ titulo: string, meta?: string, valorCentavos: number|null, extenso?: boolean,
 *           linhas?: Array<{ rotulo: string, detalhe?: string, valorCentavos?: number, texto?: string, grande?: boolean, desconto?: boolean }>,
 *           acoes?: Array<{ texto: string, icone?: string, aoClicar: Function, variante?: string }>,
 *           vazio?: string }} dados
 *   vazio: texto mostrado no lugar do número quando valorCentavos é null (ex.: "Preencha o salário").
 * @returns {HTMLElement} <section class="resultado"> com .atualizar(dadosParciais)
 */
export function cartaoResultado(dados = {}) {
  const idTitulo = idUnico('resultado');
  const raiz = h('section', { class: 'resultado', 'aria-labelledby': idTitulo });
  let estado = { extenso: false, linhas: [], acoes: [], ...dados };
  const desenhar = () => {
    const { titulo, meta, valorCentavos, extenso, linhas, acoes, vazio } = estado;
    const temValor = Number.isFinite(valorCentavos);
    trocar(raiz,
      h('div', { class: 'resultado-cab' },
        h('h2', { class: 'resultado-titulo', id: idTitulo }, titulo || 'Resultado'),
        meta ? h('span', { class: 'resultado-meta' }, meta) : null),
      h('div', { class: 'resultado-corpo' },
        h('p', { class: 'resultado-numero' },
          temValor ? [h('span', { class: 'resultado-moeda' }, 'R$'), formatarBRL(valorCentavos, { simbolo: false })] : (vazio || '—')),
        temValor && extenso ? h('p', { class: 'resultado-extenso' }, `(${porExtenso(valorCentavos)})`) : null),
      linhas && linhas.length ? h('hr', { class: 'resultado-separador', 'aria-hidden': 'true' }) : null,
      linhas && linhas.length ? h('dl', { class: 'resumo' }, linhas.map((l) => h('div', {
        class: ['resumo-linha', l.grande && 'resumo-linha--grande', l.desconto && 'resumo-linha--desconto'],
      },
      h('dt', { class: 'resumo-rotulo' }, l.rotulo, l.detalhe ? h('span', { class: 'resumo-detalhe' }, l.detalhe) : null),
      h('dd', { class: 'resumo-valor' }, Number.isFinite(l.valorCentavos) ? formatarBRL(l.valorCentavos) : (l.texto ?? '—'))))) : null,
      acoes && acoes.length ? h('div', { class: 'resultado-acoes' }, acoes.map((a, i) => botao({
        texto: a.texto, icone: a.icone, aoClicar: a.aoClicar, variante: a.variante || (i === 0 ? 'primario' : 'secundario'),
      }))) : null);
  };
  raiz.atualizar = (parcial = {}) => { estado = { ...estado, ...parcial }; desenhar(); };
  desenhar();
  return raiz;
}

/**
 * Lista "resumo" solta (rótulo à esquerda, valor à direita), sem o cartão. Mesmo formato de linhas do cartão.
 * @returns {HTMLDListElement}
 */
export function listaResumo(linhas = []) {
  return h('dl', { class: 'resumo' }, linhas.map((l) => h('div', { class: ['resumo-linha', l.grande && 'resumo-linha--grande', l.desconto && 'resumo-linha--desconto'] },
    h('dt', { class: 'resumo-rotulo' }, l.rotulo, l.detalhe ? h('span', { class: 'resumo-detalhe' }, l.detalhe) : null),
    h('dd', { class: 'resumo-valor' }, Number.isFinite(l.valorCentavos) ? formatarBRL(l.valorCentavos) : (l.texto ?? '—')))));
}

// ───────────── Mostrar a conta ─────────────
/**
 * "Mostrar a conta": renderiza os passos do motor como lista de linhas (rótulo … valor), fórmula e link da lei ↗.
 * @param {Array<{ id, rotulo, formula, valor: number|null, fonte_url?, lei?, status?, unidade?, editado_por_usuario? }>} passos
 * @param {{ titulo?: string, aberto?: boolean, idsTotal?: string[], idsDesconto?: string[], ocultar?: string[] }} opcoes
 *   idsTotal: passos que fecham a conta (traço duplo / total). idsDesconto: valores que saem (em vermelho no visual C).
 * @returns {HTMLDetailsElement} <details class="conta"> com .atualizar(passos)
 */
export function listaConta(passos = [], { titulo = 'Mostrar a conta', aberto = false, idsTotal = [], idsDesconto = [], ocultar = [] } = {}) {
  const lista = h('ol', { class: 'conta-lista' });
  const raiz = h('details', { class: 'conta', open: aberto },
    h('summary', { class: 'conta-resumo' }, h('span', null, titulo), icone('seta')),
    lista);
  const desenhar = (ps) => trocar(lista, (ps || []).filter((p) => p && !ocultar.includes(p.id)).map((p) => {
    const temValor = Number.isFinite(p.valor);
    const selos = selosDoPasso(p);
    return h('li', { class: ['conta-item', idsTotal.includes(p.id) && 'conta-item--total', idsDesconto.includes(p.id) && 'conta-item--desconto'], dataset: { passo: p.id } },
      h('div', { class: 'conta-linha' },
        h('span', { class: 'conta-rotulo' }, p.rotulo),
        h('span', { class: 'conta-guia', 'aria-hidden': 'true' }),
        temValor ? h('span', { class: 'conta-valor' }, valorSemSimbolo(p.valor)) : null),
      p.formula ? h('p', { class: 'conta-formula' }, p.formula) : null,
      selos.length ? h('div', { class: 'conta-selos' }, selos) : null,
      p.fonte_url ? linkExterno(p.fonte_url, p.lei || 'Fonte oficial', { classe: 'conta-lei', icone: icone('externo', { tamanho: 'p', classe: 'icone--externo' }) }) : null);
  }));
  raiz.atualizar = desenhar;
  desenhar(passos);
  return raiz;
}

// ───────────── Alertas ─────────────
const NIVEIS = {
  info: { palavra: 'Para saber', icone: 'info', ordem: 2 },
  atencao: { palavra: 'Atenção', icone: 'atencao', ordem: 1 },
  risco: { palavra: 'Risco', icone: 'risco', ordem: 0 },
};

/**
 * Um alerta do motor (ou feito pela tela). Mostra ícone de forma própria + palavra do nível + título + texto.
 * @param {{ nivel: 'info'|'atencao'|'risco', titulo: string, texto?: string, fonte_url?: string, lei?: string,
 *           acoes?: Array<{ texto, aoClicar, variante? }> }} a
 * @returns {HTMLElement} <aside class="alerta alerta--nivel">
 */
export function alerta(a = {}) {
  const n = NIVEIS[a.nivel] ? a.nivel : 'info';
  const cfg = NIVEIS[n];
  return h('aside', { class: ['alerta', `alerta--${n}`], dataset: { codigo: a.codigo || null } },
    h('p', { class: 'alerta-titulo' }, icone(cfg.icone), h('span', null, h('span', { class: 'alerta-nivel' }, `${cfg.palavra}: `), a.titulo || '')),
    a.texto ? h('p', { class: 'alerta-texto' }, a.texto) : null,
    a.lei ? h('p', { class: 'alerta-lei' }, a.lei) : null,
    (a.fonte_url || (a.acoes && a.acoes.length)) ? h('div', { class: 'alerta-acoes' },
      (a.acoes || []).map((ac) => botao({ texto: ac.texto, aoClicar: ac.aoClicar, variante: ac.variante || 'secundario' })),
      a.fonte_url ? linkExterno(a.fonte_url, 'Ler a lei', { classe: 'alerta-link', icone: icone('externo', { tamanho: 'p', classe: 'icone--externo' }) }) : null) : null);
}

/**
 * Vários alertas do motor, do mais grave ao mais leve.
 * @param {object[]} lista alertas do motor
 * @param {{ ignorar?: string[] }} opcoes ignorar: códigos que a tela mostra de outro jeito (padrão: 'estimativa', que já está no rodapé fixo)
 * @returns {HTMLDivElement} <div class="alertas"> (vazio se não houver alertas) com .atualizar(lista)
 */
export function alertas(lista = [], { ignorar = ['estimativa'] } = {}) {
  const raiz = h('div', { class: 'alertas' });
  raiz.atualizar = (l) => {
    const filtrados = (l || []).filter((a) => a && !ignorar.includes(a.codigo))
      .sort((x, y) => (NIVEIS[x.nivel]?.ordem ?? 3) - (NIVEIS[y.nivel]?.ordem ?? 3));
    trocar(raiz, filtrados.map(alerta));
    raiz.hidden = filtrados.length === 0;
  };
  raiz.atualizar(lista);
  return raiz;
}
