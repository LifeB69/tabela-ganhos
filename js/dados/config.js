// Tabela de Ganhos v2 — configuração: valores padrão, validação e utilidades.
// Funções puras (sem armazenamento). Quem grava é dados/armazem.js.
import { UFS, dataValida } from '../motor/index.js';
import { LIMITE_CENTAVOS } from '../motor/dinheiro.js';

export const VERSAO_FORMATO_CONFIG = 1;

/** Versão do app (mostrada em Mais → Sobre). Ao publicar, subir também o CACHE em sw.js. */
export const VERSAO_APP = '2.0.0';

/** Visual padrão: A "Talão e carimbo" (a proposta recomendada), com troca para B ou C em Mais → Configurações. */
export const VISUAL_PADRAO = 'a';

/**
 * Faixa de datas que o app aceita para as contas (a mesma do campo de data em Mais).
 * Antes de 05/10/1988 o motor não tem mínimo nem jornada e não consegue calcular.
 */
export const DATA_MIN = '2000-01-01';
export const DATA_MAX = '2099-12-31';
export function dataNaFaixa(d) { return dataValida(d) && d >= DATA_MIN && d <= DATA_MAX; }

export const OPCOES = Object.freeze({
  visual: ['a', 'b', 'c'],
  tema: ['auto', 'claro', 'escuro'],
  letra: ['normal', 'grande'],
  contraste: ['normal', 'alto'],
  movimento: ['auto', 'reduzido'],
  grupoPR: ['I', 'II', 'III', 'IV'],
  modoInicial: ['porHora', 'inverso', 'diarista', 'domestico'],
  arredondamento: ['nenhum', '0,50', '1', '5'],
});

/** Nomes para mostrar ao usuário. */
export const NOMES = Object.freeze({
  visual: { a: 'Talão e carimbo', b: 'Carteira azul', c: 'Bobina da somadora' },
  tema: { auto: 'Automático (igual ao aparelho)', claro: 'Claro', escuro: 'Escuro' },
  modo: { porHora: 'Por hora', inverso: 'Quanto posso pagar', diarista: 'Diarista', domestico: 'Doméstico' },
  arredondamento: { nenhum: 'Nenhum (centavos)', '0,50': 'R$ 0,50', 1: 'R$ 1', 5: 'R$ 5' },
});

/** Configuração padrão (perguntas do plano respondidas com as opções recomendadas). */
export const CONFIG_PADRAO = Object.freeze({
  visual: VISUAL_PADRAO,
  tema: 'auto',
  letra: 'normal',
  contraste: 'normal',
  movimento: 'auto',
  uf: '',
  grupoPR: 'II',
  padroes: Object.freeze({
    valorHora: '',
    horasDia: 4,
    diasSemana: Object.freeze([1, 2, 3, 4, 5]), // 0 = domingo … 6 = sábado
    modoInicial: 'porHora',
  }),
  arredondamento: 'nenhum',
  dataReferencia: 'auto',
  overrides: Object.freeze({}),
  opcoesNaoVerificadas: Object.freeze({}),
  /** Último estado de cada modo da calculadora: { modo, porHora, diarista, domestico } (só números). */
  calcular: Object.freeze({}),
  /** Preferências da comparação da tela Tabela: { valores[], diasDe, diasAte, horasDe, horasAte, ver }. */
  tabela: Object.freeze({}),
  /** Lembrete de backup: data (ISO) do último backup e até quando o lembrete fica escondido. */
  backup: Object.freeze({ ultimo: null, lembreteAdiadoAte: null }),
});

const MODOS_CALCULADORA = ['porHora', 'diarista', 'domestico'];

const CHAVES_APARENCIA = ['visual', 'tema', 'letra', 'contraste', 'movimento'];

/** Cópia profunda simples (só dados JSON). */
export function copiar(obj) {
  return obj === undefined ? undefined : JSON.parse(JSON.stringify(obj));
}

function ehObjeto(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function opcao(v, lista, padrao) {
  return lista.includes(v) ? v : padrao;
}

/** Texto curto e limpo: sem caracteres de controle, com limite de tamanho. Sempre devolve string. */
export function textoLimpo(v, max = 200) {
  if (v === null || v === undefined) return '';
  // eslint-disable-next-line no-control-regex
  return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);
}

// ───────────── entrada de cálculo (também usada pelo armazém nos salvos) ─────────────
const CHAVE_ENTRADA_OK = /^[A-Za-z_][A-Za-z0-9_]{0,40}$/;
function primitivo(v) {
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') return textoLimpo(v, 200);
  return undefined;
}
/** Entrada do cálculo: só dados simples (números, textos curtos, sim/não, listas e um nível de objeto). */
export function limparEntrada(e, nivel = 0) {
  const saida = {};
  if (!ehObjeto(e)) return saida;
  for (const [k, v] of Object.entries(e).slice(0, 60)) {
    if (!CHAVE_ENTRADA_OK.test(k)) continue;
    if (Array.isArray(v)) {
      saida[k] = v.slice(0, 40).map(primitivo).filter((x) => x !== undefined);
    } else if (ehObjeto(v)) {
      if (nivel < 1) saida[k] = limparEntrada(v, nivel + 1);
    } else {
      const p = primitivo(v);
      if (p !== undefined) saida[k] = p;
    }
  }
  return saida;
}

function isoOuNulo(v) {
  return typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v)) ? v : null;
}

function normalizarCalcular(c) {
  const saida = {};
  if (!ehObjeto(c)) return saida;
  if (MODOS_CALCULADORA.includes(c.modo)) saida.modo = c.modo;
  for (const m of MODOS_CALCULADORA) if (ehObjeto(c[m])) saida[m] = limparEntrada(c[m]);
  return saida;
}

function normalizarTabela(t) {
  const saida = {};
  if (!ehObjeto(t)) return saida;
  if (Array.isArray(t.valores)) {
    const v = t.valores.filter((c) => Number.isInteger(c) && c > 0 && c <= 100000000).slice(0, 5);
    if (v.length) saida.valores = v;
  }
  for (const [k, max] of [['diasDe', 31], ['diasAte', 31], ['horasDe', 24], ['horasAte', 24]]) {
    if (Number.isInteger(t[k]) && t[k] >= 1 && t[k] <= max) saida[k] = t[k];
  }
  if (typeof t.ver === 'string' && /^(todos|minimo|v[0-4])$/.test(t.ver)) saida.ver = t.ver;
  return saida;
}

function normalizarBackup(b) {
  const o = ehObjeto(b) ? b : {};
  return { ultimo: isoOuNulo(o.ultimo), lembreteAdiadoAte: isoOuNulo(o.lembreteAdiadoAte) };
}

/**
 * Overrides do motor aceitos pela config: só os que a tela Mais edita, com faixa plausível.
 * Outras chaves (inss_empregado, irrf_mensal, salario_minimo…) são objetos no motor: um número no lugar
 * delas quebra as contas. Um backup alterado não pode gravar isso.
 */
export const OVERRIDES_ACEITOS = Object.freeze({
  piso_domestico_SP: (v) => Number.isSafeInteger(v) && v > 0 && v <= LIMITE_CENTAVOS,
  piso_domestico_RS: (v) => Number.isSafeInteger(v) && v > 0 && v <= LIMITE_CENTAVOS,
  piso_domestico_SC: (v) => Number.isSafeInteger(v) && v > 0 && v <= LIMITE_CENTAVOS,
  divisor_hora: (v) => Number.isInteger(v) && v >= 100 && v <= 300,
});

function normalizarOverrides(o) {
  const saida = {};
  if (!ehObjeto(o)) return saida;
  for (const [k, v] of Object.entries(o).slice(0, 100)) {
    if (k === 'jornada_datas' && ehObjeto(v)) {
      const d = {};
      if (dataValida(v.jornada_42)) d.jornada_42 = v.jornada_42;
      if (dataValida(v.jornada_40)) d.jornada_40 = v.jornada_40;
      if (Object.keys(d).length) saida.jornada_datas = d;
    } else if (Object.prototype.hasOwnProperty.call(OVERRIDES_ACEITOS, k) && typeof v === 'number' && OVERRIDES_ACEITOS[k](v)) {
      saida[k] = v;
    }
  }
  return saida;
}

function normalizarBooleanos(o) {
  const saida = {};
  if (!ehObjeto(o)) return saida;
  for (const [k, v] of Object.entries(o).slice(0, 100)) {
    if (/^[A-Za-z0-9_]{1,60}$/.test(k) && typeof v === 'boolean') saida[k] = v;
  }
  return saida;
}

/**
 * Valida e completa uma configuração. Nunca lança erro: o que for inválido volta ao padrão.
 * @param {object} entrada configuração parcial ou completa (pode vir de backup importado)
 * @returns {object} configuração completa e válida
 */
export function normalizarConfig(entrada) {
  const c = ehObjeto(entrada) ? entrada : {};
  const P = CONFIG_PADRAO;
  const p = ehObjeto(c.padroes) ? c.padroes : {};

  const horas = Number(typeof p.horasDia === 'string' ? p.horasDia.replace(',', '.') : p.horasDia);
  let dias = Array.isArray(p.diasSemana) ? p.diasSemana.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : null;
  if (dias) dias = [...new Set(dias)].sort((a, b) => a - b);

  const cfg = {
    visual: opcao(c.visual, OPCOES.visual, P.visual),
    tema: opcao(c.tema, OPCOES.tema, P.tema),
    letra: opcao(c.letra, OPCOES.letra, P.letra),
    contraste: opcao(c.contraste, OPCOES.contraste, P.contraste),
    movimento: opcao(c.movimento, OPCOES.movimento, P.movimento),
    uf: typeof c.uf === 'string' && UFS.includes(c.uf.toUpperCase()) ? c.uf.toUpperCase() : '',
    grupoPR: opcao(c.grupoPR, OPCOES.grupoPR, P.grupoPR),
    padroes: {
      valorHora: textoLimpo(p.valorHora, 30),
      horasDia: Number.isFinite(horas) && horas > 0 && horas <= 24 ? horas : P.padroes.horasDia,
      diasSemana: dias || [...P.padroes.diasSemana],
      modoInicial: opcao(p.modoInicial, OPCOES.modoInicial, P.padroes.modoInicial),
    },
    arredondamento: opcao(String(c.arredondamento ?? ''), OPCOES.arredondamento, P.arredondamento),
    dataReferencia: c.dataReferencia === 'auto' || !dataNaFaixa(c.dataReferencia) ? 'auto' : c.dataReferencia,
    overrides: normalizarOverrides(c.overrides),
    opcoesNaoVerificadas: normalizarBooleanos(c.opcoesNaoVerificadas),
    calcular: normalizarCalcular(c.calcular),
    tabela: normalizarTabela(c.tabela),
    backup: normalizarBackup(c.backup),
  };
  if (ehObjeto(c.legadoV1)) cfg.legadoV1 = copiar(c.legadoV1);
  return cfg;
}

/**
 * Junta uma alteração parcial à configuração atual (objetos internos são mesclados, não trocados).
 * Ex.: mesclarConfig(cfg, { padroes: { horasDia: 6 } }) mantém os outros padrões.
 */
export function mesclarConfig(atual, parcial) {
  const base = copiar(atual) || {};
  if (!ehObjeto(parcial)) return normalizarConfig(base);
  for (const [k, v] of Object.entries(parcial)) {
    if (['padroes', 'opcoesNaoVerificadas', 'calcular', 'tabela', 'backup'].includes(k) && ehObjeto(v)) base[k] = { ...(base[k] || {}), ...copiar(v) };
    else if (k === 'overrides' && ehObjeto(v)) {
      // overrides: { chave: null } remove a chave ("voltar ao oficial")
      const o = { ...(base.overrides || {}) };
      for (const [ok, ov] of Object.entries(v)) { if (ov === null) delete o[ok]; else o[ok] = copiar(ov); }
      base.overrides = o;
    } else base[k] = copiar(v);
  }
  return normalizarConfig(base);
}

/** Só as 5 preferências de aparência (é o que vai para o espelho síncrono do pre-tema.js). */
export function aparencia(cfg) {
  const a = {};
  for (const k of CHAVES_APARENCIA) a[k] = cfg[k];
  return a;
}

/** Arredondamento da config em centavos para o motor (0 = sem arredondamento). */
export function centavosArredondamento(cfg) {
  return { nenhum: 0, '0,50': 50, 1: 100, 5: 500 }[cfg && cfg.arredondamento] || 0;
}

/** Data de hoje no fuso do aparelho, em AAAA-MM-DD. */
export function hojeISO(agora = new Date()) {
  const a = agora.getFullYear();
  const m = String(agora.getMonth() + 1).padStart(2, '0');
  const d = String(agora.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

/** Data de referência dos cálculos: hoje, ou a data fixada em Configurações. */
export function dataReferenciaDe(cfg, agora = new Date()) {
  return cfg && cfg.dataReferencia !== 'auto' && dataValida(cfg.dataReferencia) ? cfg.dataReferencia : hojeISO(agora);
}

/**
 * Converte as chaves antigas da v1 (localStorage) para a config nova.
 * tg-theme: 'light'|'dark'|'auto'; tg-view: 'todas' ou valor/hora; tg-calc: {h, d, r, m}.
 * @param {{ tema?: string|null, visao?: string|null, calc?: string|null }} v1 textos lidos do localStorage
 * @returns {object|null} config parcial, ou null se não havia nada da v1
 */
export function converterV1({ tema = null, visao = null, calc = null } = {}) {
  if (tema === null && visao === null && calc === null) return null;
  const parcial = { legadoV1: { migrado_em: new Date().toISOString() } };
  if (tema === 'light') parcial.tema = 'claro';
  else if (tema === 'dark') parcial.tema = 'escuro';
  if (typeof visao === 'string' && /^(todas|\d{1,4})$/.test(visao)) parcial.legadoV1.visao_tabela = visao;
  if (typeof calc === 'string') {
    try {
      const c = JSON.parse(calc);
      if (ehObjeto(c)) {
        const padroes = {};
        const r = Number(c.r);
        if (Number.isFinite(r) && r > 0 && r < 100000) padroes.valorHora = r.toFixed(2).replace('.', ',');
        const h = Number(c.h);
        if (Number.isFinite(h) && h > 0 && h <= 24) padroes.horasDia = h;
        if (Object.keys(padroes).length) parcial.padroes = padroes;
        const d = Number(c.d);
        parcial.legadoV1.calc = {
          horasDia: Number.isFinite(h) ? h : null,
          dias: Number.isFinite(d) ? d : null,
          valorHora: Number.isFinite(r) ? r : null,
          orcamento: c.m != null ? textoLimpo(c.m, 30) : null,
        };
      }
    } catch { /* tg-calc corrompido: ignora */ }
  }
  return parcial;
}
