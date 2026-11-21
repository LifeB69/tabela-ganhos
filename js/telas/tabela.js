// Tabela de Ganhos v2 — tela "Tabela": comparação do mês, salário mínimo, pisos do doméstico,
// conversor e tabelas oficiais. Todo número legal vem do motor (getParam, tabelaMinimo, tabelaPisos,
// tabelaComparacao, converterSalario, proximasMudancas): nenhum valor da lei está escrito aqui.
// Contrato: docs/ARQUITETURA-UI.md.

const SECOES = [
  { id: 'comparacao', texto: 'Comparação' },
  { id: 'minimo', texto: 'Mínimo' },
  { id: 'pisos', texto: 'Pisos' },
  { id: 'conversor', texto: 'Conversor' },
  { id: 'oficiais', texto: 'Tabelas oficiais' },
];
const SUB_CHEIA = 'completa';
const MAX_VALORES = 5;
const MAX_COLUNAS_HORAS = 6;
const PADRAO_COMP = Object.freeze({ valores: [1000, 1200, 1500], diasDe: 8, diasAte: 15, horasDe: 1, horasAte: 6, ver: 'todos' });
const NIVEIS_CALOR = 6;

let estado = null;   // estado da tela montada (zerado em desmontar)

// ───────────── utilidades ─────────────
function dataBR(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function inteiroEntre(v, min, max, padrao) {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : padrao;
}

/** Preferências da comparação, validadas (vindas do aparelho ou da v1). */
function prefsIniciais(ctx) {
  const salvo = ctx.config.tabela || {};   // config.tabela (entra no backup)
  const valores = Array.isArray(salvo.valores)
    ? salvo.valores.filter((c) => Number.isInteger(c) && c > 0 && c <= 100000000).slice(0, MAX_VALORES)
    : null;
  const p = {
    valores: valores && valores.length ? valores : [...PADRAO_COMP.valores],
    diasDe: inteiroEntre(salvo.diasDe, 1, 31, PADRAO_COMP.diasDe),
    diasAte: inteiroEntre(salvo.diasAte, 1, 31, PADRAO_COMP.diasAte),
    horasDe: inteiroEntre(salvo.horasDe, 1, 24, PADRAO_COMP.horasDe),
    horasAte: inteiroEntre(salvo.horasAte, 1, 24, PADRAO_COMP.horasAte),
    ver: typeof salvo.ver === 'string' ? salvo.ver : null,
  };
  if (p.diasDe > p.diasAte || p.horasDe > p.horasAte || p.horasAte - p.horasDe + 1 > MAX_COLUNAS_HORAS) {
    Object.assign(p, { diasDe: PADRAO_COMP.diasDe, diasAte: PADRAO_COMP.diasAte, horasDe: PADRAO_COMP.horasDe, horasAte: PADRAO_COMP.horasAte });
  }
  if (p.ver === null) {
    // A v1 guardava a visão escolhida ("10", "12", "15" ou "todas").
    const v1 = ctx.config.legadoV1 && ctx.config.legadoV1.visao_tabela;
    const i = v1 ? p.valores.indexOf(Number(v1) * 100) : -1;
    p.ver = i >= 0 ? `v${i}` : PADRAO_COMP.ver;
  }
  return p;
}

function intervalo(de, ate) {
  const lista = [];
  for (let i = de; i <= ate; i++) lista.push(i);
  return lista;
}

// ───────────── montagem ─────────────
/** @param {HTMLElement} raiz  @param {object} ctx */
export async function montar(raiz, ctx) {
  await ctx.carregarCss('css/telas/tabela.css');
  const { ui } = ctx;
  const { h } = ui;

  estado = {
    ctx, raiz,
    prefs: prefsIniciais(ctx),
    celular: window.matchMedia('(max-width: 719.98px)'),
    cheia: null,              // <dialog> da tabela em tela cheia
    empurrouHistorico: false, // a tela cheia criou a entrada #tabela/completa no histórico
    ouvintes: [],
    timers: new Set(),
    secoes: {},
  };

  const nav = h('nav', { class: 'tab-indice', 'aria-label': 'Partes desta tela' },
    h('ul', { class: 'tab-indice-lista' }, SECOES.map((s) => h('li', null,
      h('a', { class: 'tab-indice-link', href: `#tabela/${s.id}`, on: { click: (e) => irParaPeloLink(e, s.id) } }, s.texto)))));

  const corpo = h('div', { class: 'tab-corpo' });
  for (const s of SECOES) {
    const sec = h('section', { class: 'bloco tab-secao', id: `tab-sec-${s.id}`, 'aria-labelledby': `tab-tit-${s.id}` });
    estado.secoes[s.id] = sec;
    corpo.append(sec);
  }

  raiz.append(h('section', { class: 'tela', 'aria-labelledby': 'titulo-tela' },
    ui.cabecalhoTela({ titulo: 'Tabela', sub: 'Compare valores por hora e consulte o mínimo, os pisos e as tabelas da lei.' }),
    nav,
    corpo));

  montarComparacao();
  desenharMinimo();
  desenharPisos();
  montarConversor();
  desenharOficiais();

  // Celular ↔ computador: a tabela inteira só aparece direto no computador.
  const aoMudarLargura = () => {
    desenharGrade();
    if (!estado.celular.matches && estado.cheia) fecharCheia({ semHistorico: true });
  };
  ouvir(estado.celular, 'change', aoMudarLargura);

  // Configuração mudou (estado, grupo do PR, data, valores editados): refaz as partes que dependem dela.
  ouvir(window, 'tg:config', (e) => {
    const mudou = (e.detail && e.detail.mudou) || [];
    if (mudou.some((k) => ['uf', 'grupoPR', 'overrides', 'dataReferencia'].includes(k))) atualizarTudo();
  });

  // Sub-rota inicial (#tabela/pisos, #tabela/completa): depois que o roteador põe o foco no título.
  const sub = ctx.rota && ctx.rota.sub;
  if (sub) agendar(() => aplicarSub(sub, { inicial: true }), 30);
}

export async function aoMudarRota(rota) {
  if (!estado) return;
  aplicarSub(rota.sub || null, { inicial: false });
}

export function desmontar() {
  if (!estado) return;
  for (const [alvo, evento, fn] of estado.ouvintes) alvo.removeEventListener(evento, fn);
  for (const t of estado.timers) clearTimeout(t);
  if (estado.cheia) { try { estado.cheia.close(); } catch { /* já fechado */ } estado.cheia.remove(); }
  estado = null;
}

function ouvir(alvo, evento, fn) {
  alvo.addEventListener(evento, fn);
  estado.ouvintes.push([alvo, evento, fn]);
}
function agendar(fn, ms) {
  const t = setTimeout(() => { estado && estado.timers.delete(t); if (estado) fn(); }, ms);
  estado.timers.add(t);
  return t;
}

function atualizarTudo() {
  desenharGrade();
  desenharMinimo();
  desenharPisos();
  recalcularConversor();
  desenharOficiais();
}

// ───────────── navegação entre as partes ─────────────
function irParaPeloLink(e, id) {
  e.preventDefault();
  estado.ctx.navegar(`#tabela/${id}`, { substituir: true });
}

function aplicarSub(sub, { inicial }) {
  const raizSub = (sub || '').split('/')[0];
  if (raizSub === SUB_CHEIA) {
    if (estado.celular.matches) { abrirCheiaDialogo({ inicial }); return; }
    rolarPara('comparacao', { instantaneo: inicial });
    return;
  }
  if (estado.cheia) fecharCheia({ semHistorico: true });
  if (SECOES.some((s) => s.id === raizSub)) rolarPara(raizSub, { instantaneo: inicial });
}

function rolarPara(id, { instantaneo = false } = {}) {
  const sec = estado.secoes[id];
  if (!sec) return;
  const reduzido = instantaneo || document.documentElement.dataset.movimento === 'reduzido'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  sec.scrollIntoView({ behavior: reduzido ? 'auto' : 'smooth', block: 'start' });
  const titulo = sec.querySelector('.bloco-titulo');
  if (titulo) titulo.focus({ preventScroll: true });
}

function tituloSecao(id, texto, sub = null) {
  const { h } = estado.ctx.ui;
  return [
    h('h2', { class: 'bloco-titulo', id: `tab-tit-${id}`, tabindex: '-1' }, texto),
    sub ? h('p', { class: 'bloco-sub' }, sub) : null,
  ];
}

function fonte(param, { prefixo = 'Em vigor desde' } = {}) {
  const { ui } = estado.ctx;
  const { h } = ui;
  if (!param) return null;
  const vig = param.vigente_desde ? `${prefixo} ${dataBR(param.vigente_desde)}${param.vigente_ate ? ` até ${dataBR(param.vigente_ate)}` : ''}` : null;
  return h('p', { class: 'tab-fonte' },
    vig ? h('span', null, vig) : null,
    vig && param.fonte_url ? h('span', { 'aria-hidden': 'true' }, ' · ') : null,
    param.fonte_url ? ui.linkExterno(param.fonte_url, param.lei || 'Fonte oficial', { icone: ui.icone('externo', { tamanho: 'p', classe: 'icone--externo' }) }) : null);
}

// ═════════════ (1) Comparação do mês ═════════════
function series() {
  // Lista de séries mostradas: os valores escolhidos + o mínimo (rótulo e valor vêm do motor).
  const { motor } = estado.ctx;
  const r = motor.tabelaComparacao({ valoresHora: estado.prefs.valores, horasDia: 1, dias: 1 }, estado.ctx.dataReferencia(), { overrides: estado.ctx.overrides() });
  return r.resultado.colunas.map((c, i) => ({
    chave: c.minimo ? 'minimo' : `v${i}`,
    rotulo: c.rotulo,
    curto: c.minimo ? 'Mínimo' : c.rotulo,
    valor_hora: c.valor_hora,
    minimo: c.minimo,
    abaixo_minimo: c.abaixo_minimo,
  }));
}

/** Calcula a grade inteira pelo motor: para cada (dias, horas), as colunas de tabelaComparacao. */
function calcularGrade() {
  const { motor } = estado.ctx;
  const data = estado.ctx.dataReferencia();
  const overrides = estado.ctx.overrides();
  const { valores, diasDe, diasAte, horasDe, horasAte } = estado.prefs;
  const dias = intervalo(diasDe, diasAte);
  const horas = intervalo(horasDe, horasAte);
  const celulas = new Map();
  let alertas = [];
  let passoMinimo = null;
  for (const d of dias) {
    for (const hh of horas) {
      const r = motor.tabelaComparacao({ valoresHora: valores, horasDia: hh, dias: d }, data, { overrides });
      celulas.set(`${d}|${hh}`, r.resultado.colunas);
      if (!passoMinimo) { alertas = r.alertas; passoMinimo = r.passos[0]; }
    }
  }
  return { dias, horas, celulas, alertas, passoMinimo, series: series() };
}

function montarComparacao() {
  const { ui } = estado.ctx;
  const { h } = ui;
  const sec = estado.secoes.comparacao;
  const g = {};
  estado.comp = g;

  g.ver = h('div', { class: 'tab-ver' });
  g.alertas = ui.alertas([]);
  g.nota = h('div', { class: 'tab-nota-minimo' });
  g.grade = h('div', { class: 'tab-grade' });
  g.abrir = h('button', { type: 'button', class: 'tab-abrir', 'aria-haspopup': 'dialog', on: { click: () => estado.ctx.navegar(`#tabela/${SUB_CHEIA}`) } },
    h('span', { class: 'tab-abrir-texto' }, h('strong', null, 'Ver tabela completa'), g.abrirSub = h('small', null, '')),
    ui.icone('avancar'));
  g.copiar = ui.botao({ texto: 'Copiar para planilha', icone: 'copiar', aoClicar: copiarPlanilha });
  g.ajustes = montarAjustes();

  sec.append(
    ...tituloSecao('comparacao', 'Comparação do mês', 'Total do mês para cada combinação de dias e horas por dia. Toque num valor para levar os números para a calculadora.'),
    g.ver,
    g.abrir,
    g.grade,
    g.nota,
    g.alertas,
    h('div', { class: 'grupo-botoes tab-acoes-comp' }, g.copiar),
    g.ajustes);
  desenharGrade();
}

function desenharSeletorVer(alvo, lista) {
  const { ui } = estado.ctx;
  const opcoes = [
    ...lista.map((s) => ({ valor: s.chave, texto: s.minimo ? 'Mínimo' : s.curto, rotulo: s.minimo ? s.rotulo : `${s.rotulo} por hora` })),
    { valor: 'todos', texto: lista.length > 2 ? `Todos (${lista.length})` : 'Todos', rotulo: 'Todos os valores juntos' },
  ];
  if (!opcoes.some((o) => o.valor === estado.prefs.ver)) estado.prefs.ver = 'todos';
  ui.trocar(alvo, ui.segmentos({
    rotulo: 'Mostrar na tabela', variante: 'chips', valor: estado.prefs.ver, opcoes,
    aoMudar: (v) => { estado.prefs.ver = v; salvarPrefs(); desenharGrade(); },
  }));
}

function salvarPrefs() {
  const { ctx } = estado;
  ctx.salvarConfig({ tabela: { ...estado.prefs } }).catch(() => { /* sem armazenamento: vale só nesta abertura */ });
}

function desenharGrade() {
  if (!estado || !estado.comp) return;
  const { ui } = estado.ctx;
  const { h } = ui;
  const g = estado.comp;
  const grade = calcularGrade();
  estado.gradeAtual = grade;
  desenharSeletorVer(g.ver, grade.series);

  const { diasDe, diasAte, horasDe, horasAte } = estado.prefs;
  g.abrirSub.textContent = `${diasDe} a ${diasAte} dias × ${horasDe} a ${horasAte} ${horasAte === 1 ? 'hora' : 'horas'} por dia`;

  const celular = estado.celular.matches;
  g.abrir.hidden = !celular;
  ui.trocar(g.grade, celular ? null : tabelaGrade(grade, { compacta: false }));

  // Nota do mínimo: o que é a série "mínimo" e de onde vem (conta do app quando derivado).
  const p = grade.passoMinimo;
  const minimo = grade.series.find((s) => s.minimo);
  ui.trocar(g.nota,
    p ? h('p', { class: 'tab-nota' },
      h('strong', null, `${minimo ? minimo.rotulo : p.rotulo}: `), p.formula, '. ',
      p.fonte_url ? ui.linkExterno(p.fonte_url, p.lei || 'Fonte oficial', { classe: 'tab-link-alvo', icone: ui.icone('externo', { tamanho: 'p', classe: 'icone--externo' }) }) : null) : null);
  g.alertas.atualizar(grade.alertas);

  if (estado.cheia) desenharCheia();
}

/** Nível de cor (0 a 5) pelo total, em relação ao maior total da grade. */
function nivelCalor(total, maximo) {
  if (!maximo || total <= 0) return 0;
  return Math.min(NIVEIS_CALOR - 1, Math.floor((total / maximo) * NIVEIS_CALOR));
}

function textoValor(centavos, compacta) {
  const { motor } = estado.ctx;
  // Formato compacto (celular): sem "R$" e sem centavos, arredondado para o real mais próximo.
  // Computador: sem "R$" em cada célula (a legenda diz que é em reais), com centavos.
  return compacta ? motor.formatarNumero(Math.round(centavos / 100)) : motor.formatarBRL(centavos, { simbolo: false });
}

/** Monta a <table> da comparação. compacta = formato do celular em tela cheia. */
function tabelaGrade(grade, { compacta }) {
  const { ui, motor } = estado.ctx;
  const { h } = ui;
  const ver = estado.prefs.ver;
  const todas = ver === 'todos';
  const indices = todas ? grade.series.map((_, i) => i) : [grade.series.findIndex((s) => s.chave === ver)].filter((i) => i >= 0);
  const mostradas = indices.map((i) => grade.series[i]);
  const multi = mostradas.length > 1;
  // Cor: pela maior série escolhida pela pessoa (sem o mínimo), ou pela série mostrada.
  const idxCor = todas
    ? grade.series.reduce((m, s, i) => (!s.minimo && (m < 0 || s.valor_hora > grade.series[m].valor_hora) ? i : m), -1)
    : indices[0];
  const idxCorFinal = idxCor >= 0 ? idxCor : indices[0];
  let maximo = 0;
  for (const cols of grade.celulas.values()) maximo = Math.max(maximo, cols[idxCorFinal] ? cols[idxCorFinal].total : 0);

  const linhasSerie = (valoresPorSerie, { prefixo }) => mostradas.map((s, k) => h('span', {
    class: ['tab-linha', s.minimo && 'tab-linha--minimo', s.abaixo_minimo && 'tab-linha--abaixo'],
  }, prefixo && multi ? h('span', { class: 'tab-linha-rotulo' }, `${s.curto} `) : null, valoresPorSerie[k]));

  const primeiraCol = h('span', { class: 'tab-th-dias' }, compacta ? 'Dias' : 'Dias \\ horas por dia',
    multi ? h('span', { class: 'tab-th-ordem', 'aria-hidden': 'true' }, mostradas.map((s) => h('span', { class: ['tab-linha', s.minimo && 'tab-linha--minimo'] },
      compacta ? (s.minimo ? 'mín.' : textoValor(s.valor_hora, true)) : (s.minimo ? s.curto : `a ${s.rotulo}/h`)))) : null);

  const colunas = [{ rotulo: primeiraCol, classe: 'tab-col-dias' }, ...grade.horas.map((hh) => {
    const cols = grade.celulas.get(`${grade.dias[0]}|${hh}`);
    const porDia = mostradas.map((s) => {
      const c = cols[grade.series.indexOf(s)];
      return textoValor(c.dia, compacta);
    });
    return {
      numerica: true,
      rotulo: h('span', { class: 'tab-th-hora' },
        h('span', { class: 'tab-th-h' }, compacta ? `${hh} h` : `${hh} h/dia`),
        h('span', { class: 'tab-th-dia' }, compacta ? null : h('span', { class: 'tab-linha' }, 'por dia'), linhasSerie(porDia, { prefixo: false }))),
    };
  })];

  const linhas = grade.dias.map((d) => [
    { texto: compacta ? String(d) : `${d} dias` },
    ...grade.horas.map((hh) => {
      const cols = grade.celulas.get(`${d}|${hh}`);
      const totais = mostradas.map((s) => cols[grade.series.indexOf(s)].total);
      const falado = mostradas.map((s, k) => `${s.minimo ? s.rotulo : `a ${s.rotulo} por hora`}: ${motor.formatarBRL(totais[k])}`).join('; ');
      const nivel = nivelCalor(cols[idxCorFinal] ? cols[idxCorFinal].total : 0, maximo);
      const botao = h('button', {
        type: 'button', class: 'tab-celula',
        'aria-label': `${d} dias, ${hh} ${hh === 1 ? 'hora' : 'horas'} por dia. ${falado}. Levar para a calculadora.`,
        title: `${d} dias × ${hh} h`,
        on: { click: () => escolherCelula(d, hh, mostradas) },
      }, linhasSerie(totais.map((t) => textoValor(t, compacta)), { prefixo: false }));
      return { no: botao, classe: `tab-calor tab-calor-${nivel}` };
    }),
  ]);

  const legenda = compacta
    ? (multi
      ? `Total do mês em reais, sem centavos. Cada célula mostra, de cima para baixo: ${mostradas.map((s) => (s.minimo ? s.rotulo.toLowerCase() : s.rotulo)).join(', ')}.`
      : `Total do mês em reais, sem centavos, a ${mostradas[0] ? mostradas[0].rotulo : ''} por hora.`)
    : (multi
      ? `Total do mês em reais. Cada célula mostra, de cima para baixo: ${mostradas.map((s) => (s.minimo ? s.rotulo.toLowerCase() : s.rotulo)).join(', ')}. Embaixo de cada hora, o valor por dia.`
      : `Total do mês em reais, a ${mostradas[0] ? mostradas[0].rotulo : ''} por hora. Embaixo de cada hora, o valor por dia.`);

  const tab = ui.tabela({
    legenda, colunas, linhas, fixarPrimeira: true,
    classe: ['tab-comparacao', compacta && 'tab-comparacao--compacta', multi && 'tab-comparacao--multi'].filter(Boolean).join(' '),
  });
  const explica = h('p', { class: 'tab-legenda' },
    'Cor mais forte = total maior. ',
    multi ? 'A linha do mínimo vem por último, sublinhada. ' : null,
    compacta ? 'Valores em reais, arredondados para o real mais próximo. ' : null,
    'Toque num valor para abrir a calculadora com esses números.');
  return [tab, explica];
}

async function escolherCelula(dias, horasDia, mostradas) {
  const { ui, motor } = estado.ctx;
  let serie = mostradas.length === 1 ? mostradas[0] : null;
  if (!serie) {
    const f = ui.folha({
      titulo: `${dias} dias × ${horasDia} ${horasDia === 1 ? 'hora' : 'horas'} por dia`,
      conteudo: ui.h('p', null, 'Qual valor por hora levar para a calculadora?'),
      acoes: mostradas.map((s) => ({ texto: s.minimo ? `${s.curto} (${motor.formatarBRL(s.valor_hora)})` : s.rotulo, valor: s.chave, variante: 'secundario' })),
    });
    const chave = await f.fechado;
    if (!estado || !chave) return;
    serie = mostradas.find((s) => s.chave === chave);
    if (!serie) return;
  }
  levarParaCalcular({ valorHora: serie.valor_hora, horasDia, dias });
}

function levarParaCalcular({ valorHora, horasDia, dias }) {
  const { ctx } = estado;
  // Rota própria (não é um link compartilhado): a Calcular mostra "Números vindos da Tabela".
  const q = new URLSearchParams({ de: 'tabela', valorHora: String(valorHora), horasDia: String(horasDia), dias: String(dias) });
  if (estado.cheia) fecharCheia({ semHistorico: true });
  ctx.navegar(`#calcular?${q}`);
}

async function copiarPlanilha() {
  const { ctx } = estado;
  const { motor } = ctx;
  const grade = estado.gradeAtual || calcularGrade();
  const sem = (c) => motor.formatarBRL(c, { simbolo: false });
  const linhas = [['Valor por hora', 'Dias', 'Horas por dia', 'Valor por dia', 'Total do mês']];
  grade.series.forEach((s, i) => {
    for (const d of grade.dias) {
      for (const hh of grade.horas) {
        const c = grade.celulas.get(`${d}|${hh}`)[i];
        linhas.push([s.minimo ? `${sem(s.valor_hora)} (${s.rotulo})` : sem(s.valor_hora), d, motor.formatarNumero(hh), sem(c.dia), sem(c.total)]);
      }
    }
  });
  const texto = linhas.map((l) => l.join('\t')).join('\n');
  const ok = await ctx.compartilhar.copiar(texto);
  const n = linhas.length - 1;
  ctx.toast(ok ? `Copiado: ${n} linhas. Cole na planilha.` : 'Não deu para copiar neste aparelho.');
}

// ── Ajustes da comparação (valores, dias, horas) ──
function montarAjustes() {
  const { ui } = estado.ctx;
  const { h } = ui;
  const lista = h('div', { class: 'tab-valores' });
  const faixa = h('div', { class: 'tab-faixas' });
  const det = h('details', { class: 'tab-ajustes' },
    h('summary', { class: 'tab-ajustes-resumo' }, h('span', null, 'Mudar valores, dias e horas'), ui.icone('seta')),
    h('div', { class: 'tab-ajustes-corpo' },
      h('p', { class: 'campo-dica' }, `Até ${MAX_VALORES} valores por hora. O mínimo entra sempre, como referência.`),
      lista,
      faixa,
      h('div', { class: 'grupo-botoes' }, ui.botao({ texto: 'Voltar ao padrão', variante: 'texto', aoClicar: restaurarPadrao }))));
  estado.ajustes = { lista, faixa };
  desenharValores();
  desenharFaixas();
  return det;
}

function aplicarMudanca() {
  salvarPrefs();
  if (estado.timerGrade) { clearTimeout(estado.timerGrade); estado.timers.delete(estado.timerGrade); }
  estado.timerGrade = agendar(() => desenharGrade(), 250);
}

function desenharValores() {
  const { ui } = estado.ctx;
  const { h } = ui;
  const { lista } = estado.ajustes;
  const valores = estado.prefs.valores;
  const campos = valores.map((c, i) => {
    const campo = ui.campoDinheiro({
      rotulo: `Valor ${i + 1} por hora`, valor: c,
      aoMudar: (centavos, { valido }) => {
        if (!valido || centavos === null) return;
        if (centavos <= 0) { campo.mostrarErro('Use um valor maior que zero.'); return; }
        estado.prefs.valores[i] = centavos;
        aplicarMudanca();
      },
    });
    const remover = valores.length > 1
      ? ui.botao({ variante: 'icone', icone: 'lixeira', rotulo: `Tirar o valor ${i + 1}`, classe: 'botao--texto', aoClicar: () => {
        estado.prefs.valores.splice(i, 1);
        if (estado.prefs.ver.startsWith('v')) estado.prefs.ver = 'todos';
        salvarPrefs(); desenharValores(); desenharGrade();
        const primeiro = estado.ajustes.lista.querySelector('input');
        if (primeiro) primeiro.focus();
        estado.ctx.anunciar(`Valor ${i + 1} retirado.`);
      } })
      : null;
    return h('div', { class: 'tab-valor' }, campo, remover);
  });
  const adicionar = valores.length < MAX_VALORES
    ? ui.botao({ texto: 'Adicionar valor', icone: 'somar', aoClicar: () => {
      const ultimo = estado.prefs.valores[estado.prefs.valores.length - 1] || 1000;
      estado.prefs.valores.push(ultimo + 500);
      salvarPrefs(); desenharValores(); desenharGrade();
      const inputs = estado.ajustes.lista.querySelectorAll('input');
      if (inputs.length) inputs[inputs.length - 1].focus();
    } })
    : h('p', { class: 'campo-dica' }, `Já são ${MAX_VALORES} valores, o máximo.`);
  ui.trocar(lista, campos, adicionar);
}

function desenharFaixas() {
  const { ui } = estado.ctx;
  const { h } = ui;
  const p = estado.prefs;
  const campos = {};
  const conferir = () => {
    const dDe = campos.diasDe.lerValor();
    const dAte = campos.diasAte.lerValor();
    const hDe = campos.horasDe.lerValor();
    const hAte = campos.horasAte.lerValor();
    if ([dDe, dAte, hDe, hAte].some((n) => n === null)) return;
    let ok = true;
    if (dDe > dAte) { campos.diasAte.mostrarErro('O último dia precisa ser igual ou maior que o primeiro.'); ok = false; } else campos.diasAte.mostrarErro(null);
    if (hDe > hAte) { campos.horasAte.mostrarErro('A maior hora precisa ser igual ou maior que a menor.'); ok = false; }
    else if (hAte - hDe + 1 > MAX_COLUNAS_HORAS) { campos.horasAte.mostrarErro(`No máximo ${MAX_COLUNAS_HORAS} colunas de horas, para caber na tela.`); ok = false; }
    else campos.horasAte.mostrarErro(null);
    if (!ok) return;
    Object.assign(estado.prefs, { diasDe: dDe, diasAte: dAte, horasDe: hDe, horasAte: hAte });
    aplicarMudanca();
  };
  campos.diasDe = ui.campoNumero({ rotulo: 'Dias: de', valor: p.diasDe, min: 1, max: 31, unidade: 'dias', aoMudar: conferir });
  campos.diasAte = ui.campoNumero({ rotulo: 'Dias: até', valor: p.diasAte, min: 1, max: 31, unidade: 'dias', aoMudar: conferir });
  campos.horasDe = ui.campoNumero({ rotulo: 'Horas por dia: de', valor: p.horasDe, min: 1, max: 24, unidade: 'horas', aoMudar: conferir });
  campos.horasAte = ui.campoNumero({ rotulo: 'Horas por dia: até', valor: p.horasAte, min: 1, max: 24, unidade: 'horas', aoMudar: conferir });
  ui.trocar(estado.ajustes.faixa,
    h('div', { class: 'grade-2' }, campos.diasDe, campos.diasAte),
    h('div', { class: 'grade-2' }, campos.horasDe, campos.horasAte));
}

function restaurarPadrao() {
  estado.prefs = { ...PADRAO_COMP, valores: [...PADRAO_COMP.valores] };
  salvarPrefs();
  desenharValores();
  desenharFaixas();
  desenharGrade();
  estado.ctx.toast('A comparação voltou ao padrão.');
}

// ── Tela cheia no celular ──
function abrirCheiaDialogo({ inicial }) {
  const { ui } = estado.ctx;
  const { h } = ui;
  if (estado.cheia) return;
  estado.empurrouHistorico = !inicial;
  const idTitulo = 'tab-cheia-titulo';
  const voltar = h('button', { type: 'button', class: 'botao botao--texto tab-voltar', on: { click: () => fecharCheia() } },
    ui.icone('voltar'), 'Voltar');
  estado.cheiaCorpo = h('div', { class: 'tab-cheia-corpo' });
  const dlg = h('dialog', { class: 'tab-cheia', 'aria-labelledby': idTitulo },
    h('div', { class: 'tab-cheia-cab' }, voltar, h('h2', { class: 'tab-cheia-titulo', id: idTitulo }, 'Comparação do mês')),
    estado.cheiaCorpo);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); fecharCheia(); });
  estado.raiz.append(dlg);
  estado.cheia = dlg;
  document.documentElement.classList.add('tab-cheia-aberta');
  desenharCheia();
  try { dlg.showModal(); } catch { dlg.setAttribute('open', ''); }
  dlg.scrollTop = 0;
  voltar.focus({ preventScroll: true });
  estado.ctx.anunciar('Tabela completa aberta. Toque em Voltar para fechar.');
}

function desenharCheia() {
  const { ui } = estado.ctx;
  const grade = estado.gradeAtual || calcularGrade();
  const ver = ui.h('div', { class: 'tab-ver' });
  desenharSeletorVer(ver, grade.series);
  ui.trocar(estado.cheiaCorpo, ver, tabelaGrade(grade, { compacta: true }),
    ui.h('div', { class: 'grupo-botoes' }, ui.botao({ texto: 'Copiar para planilha', icone: 'copiar', aoClicar: copiarPlanilha })));
}

/** Fecha a tela cheia. Se ela criou a entrada no histórico, volta (o botão voltar do celular faz o mesmo). */
function fecharCheia({ semHistorico = false } = {}) {
  if (!estado || !estado.cheia) return;
  const dlg = estado.cheia;
  estado.cheia = null;
  try { dlg.close(); } catch { /* já fechado */ }
  dlg.remove();
  document.documentElement.classList.remove('tab-cheia-aberta');
  const empurrou = estado.empurrouHistorico;
  estado.empurrouHistorico = false;
  if (!semHistorico) {
    if (empurrou && location.hash === `#tabela/${SUB_CHEIA}`) history.back();
    else estado.ctx.navegar('#tabela/comparacao', { substituir: true });
  }
  if (estado.comp && estado.comp.abrir && !estado.comp.abrir.hidden) estado.comp.abrir.focus({ preventScroll: true });
}

// ═════════════ (2) Salário mínimo ═════════════
function rotuloUnidade(valor, unidade) {
  const { motor } = estado.ctx;
  if (valor === null || valor === undefined) return '—';
  if (unidade === 'centavos') {
    const c = typeof valor === 'object' ? valor.mensal : valor;
    return Number.isFinite(c) ? motor.formatarBRL(c) : '—';
  }
  if (typeof valor !== 'number') return '—';
  if (unidade === 'horas') return `${motor.formatarNumero(valor)} h`;
  if (unidade === 'dias') return valor === 1 ? '1 dia' : `${motor.formatarNumero(valor)} dias`;
  if (unidade === 'percentual') return motor.formatarPct(valor);
  return motor.formatarNumero(valor);
}

function desenharMinimo() {
  const { ui, motor } = estado.ctx;
  const { h } = ui;
  const sec = estado.secoes.minimo;
  const data = estado.ctx.dataReferencia();
  const overrides = estado.ctx.overrides();
  const r = motor.tabelaMinimo(data, { overrides });
  const m = r.resultado;
  const pHora = r.passos.find((p) => p.id === 'hora_minima');
  const pMes = r.passos.find((p) => p.id === 'minimo_mensal');

  const resumo = ui.listaResumo([
    { rotulo: 'Por mês', valorCentavos: m.mensal, grande: true },
    { rotulo: 'Por dia', valorCentavos: m.diario },
    { rotulo: m.hora_derivada ? 'Por hora (conta do app)' : 'Por hora', valorCentavos: m.hora },
  ]);
  const selosMes = pMes ? ui.selosDoPasso(pMes) : [];

  const jornada = ui.listaResumo([
    { rotulo: 'Jornada máxima', texto: `${motor.formatarNumero(m.jornada_semanal)} horas por semana` },
    { rotulo: 'Divisor do salário-hora', detalhe: 'salário do mês ÷ divisor = valor da hora', texto: motor.formatarNumero(m.divisor) },
    { rotulo: 'Descanso semanal remunerado', texto: m.repouso_dias === 1 ? '1 dia por semana' : `${m.repouso_dias} dias por semana` },
  ]);

  const previstos = (m.previstos || []).map((p) => h('div', { class: 'tab-previsto' },
    h('p', { class: 'tab-previsto-titulo' },
      ui.selo('previsto', `Previsto para ${p.vigente_desde.slice(0, 4)}`),
      h('span', { class: 'tab-previsto-valor numero' }, `${motor.formatarBRL(p.mensal)} por mês`),
      h('span', { class: 'texto-2' }, ` a partir de ${dataBR(p.vigente_desde)}`)),
    p.observacao ? h('p', { class: 'tab-obs' }, p.observacao) : null,
    p.fonte_url ? h('p', { class: 'tab-fonte' }, ui.linkExterno(p.fonte_url, p.lei || 'Fonte', { icone: ui.icone('externo', { tamanho: 'p', classe: 'icone--externo' }) })) : null));

  const mudancas = motor.proximasMudancas(data).resultado.mudancas;
  const listaMud = mudancas.length
    ? h('ol', { class: 'tab-mudancas' }, mudancas.map((x) => h('li', { class: 'tab-mudanca' },
      h('p', { class: 'tab-mudanca-data numero' }, h('time', { datetime: x.vigente_desde }, dataBR(x.vigente_desde))),
      h('div', { class: 'tab-mudanca-corpo' },
        h('p', { class: 'tab-mudanca-rotulo' }, h('strong', null, x.rotulo)),
        h('p', { class: 'tab-mudanca-valores' },
          x.valor_atual !== null && x.valor_atual !== undefined ? `De ${rotuloUnidade(x.valor_atual, x.unidade)} para ` : 'Passa a ',
          h('strong', null, rotuloUnidade(x.valor_novo, x.unidade))),
        ui.selosDoPasso(x).length ? h('div', { class: 'tab-selos' }, ui.selosDoPasso(x)) : null,
        x.fonte_url ? h('p', { class: 'tab-fonte' }, ui.linkExterno(x.fonte_url, x.lei || 'Fonte', { icone: ui.icone('externo', { tamanho: 'p', classe: 'icone--externo' }) })) : null))))
    : h('p', { class: 'texto-2' }, 'Nenhuma mudança marcada a partir desta data.');

  ui.trocar(sec,
    ...tituloSecao('minimo', 'Salário mínimo', `Valores para ${dataBR(data)}.`),
    h('div', { class: 'bloco--papel tab-papel' },
      resumo,
      selosMes.length ? h('div', { class: 'tab-selos' }, selosMes) : null,
      pHora && m.hora_derivada ? h('p', { class: 'tab-obs' }, pHora.formula, '.') : null,
      fonte(motor.getParam('salario_minimo', data, overrides) || motor.getParamComReserva('salario_minimo', data, overrides))),
    h('h3', { class: 'tab-h3' }, 'Jornada nesta data'),
    jornada,
    previstos.length ? h('h3', { class: 'tab-h3' }, 'O que está previsto') : null,
    previstos,
    ui.alertas(r.alertas),
    h('h3', { class: 'tab-h3' }, 'Próximas mudanças'),
    listaMud);
}

// ═════════════ (3) Pisos estaduais do doméstico ═════════════
function desenharPisos() {
  const { ui, motor } = estado.ctx;
  const { h } = ui;
  const sec = estado.secoes.pisos;
  const data = estado.ctx.dataReferencia();
  const cfg = estado.ctx.config;
  const r = motor.tabelaPisos(data, { overrides: estado.ctx.overrides() });
  const { linhas, divisor } = r.resultado;
  const minimo = linhas.find((l) => l.uf === 'demais');
  const ehSeu = (l) => !!cfg.uf && (l.uf === cfg.uf || (l.uf === 'demais' && (l.ufs || []).includes(cfg.uf)));

  const situacao = (l) => {
    if (l.status === 'nao_verificado') return ui.selo('nao_verificado');
    if (l.status === 'previsto') return ui.selo('previsto');
    if (l.status === 'sem_vigencia') return ui.selo('info', 'Sem vigência nesta data');
    if (l.origem === 'minimo' && l.uf !== 'demais') return ui.selo('info', 'Vale o mínimo');
    return ui.selo('ok', 'Em vigor');
  };

  const tab = ui.tabela({
    legenda: `Piso do empregado doméstico em ${dataBR(data)}. Valor por hora = valor usado no cálculo ÷ ${divisor}.`,
    empilhada: true,
    zebra: true,
    colunas: [
      { rotulo: 'Estado' },
      { rotulo: 'Piso por mês', numerica: true },
      { rotulo: 'Por hora', numerica: true },
      { rotulo: 'Desde' },
      { rotulo: 'Situação' },
    ],
    linhas: linhas.map((l) => {
      const seu = ehSeu(l);
      const nome = l.uf === 'demais' ? 'Demais estados' : l.uf;
      const mes = l.piso_estadual !== null
        ? h('span', { class: 'tab-piso-mes' }, motor.formatarBRL(l.piso_estadual),
          l.usado_no_calculo !== l.piso_estadual ? h('small', { class: 'tab-piso-usado' }, `cálculo usa ${motor.formatarBRL(l.usado_no_calculo)}`) : null)
        : motor.formatarBRL(l.usado_no_calculo);
      return [
        { no: h('span', { class: 'tab-uf' }, nome, seu ? h('span', { class: 'tab-seu' }, ' (seu estado)') : null), classe: seu ? 'tab-linha-seu' : null },
        { no: mes, classe: seu ? 'tab-linha-seu' : null },
        { texto: motor.formatarBRL(l.hora), classe: seu ? 'tab-linha-seu' : null },
        // PR: a fonte citada não traz a data de início (docs/PENDENCIAS-UI.md).
        { texto: l.uf === 'PR' && l.vigente_ate ? `Até ${dataBR(l.vigente_ate)} (início não confirmado)` : l.vigente_desde ? `${dataBR(l.vigente_desde)}${l.vigente_ate ? ` a ${dataBR(l.vigente_ate)}` : ''}` : '—', classe: seu ? 'tab-linha-seu' : null },
        { no: situacao(l), classe: seu ? 'tab-linha-seu' : null },
      ];
    }),
  });
  // Marca a linha inteira do seu estado (o <tr>), para o destaque não depender só da célula.
  tab.querySelectorAll('tbody tr').forEach((tr) => { if (tr.querySelector('.tab-linha-seu')) tr.classList.add('tab-tr-seu'); });

  const pr = linhas.find((l) => l.uf === 'PR');
  const grupos = pr && pr.grupos
    ? h('div', { class: 'tab-grupos' },
      h('h3', { class: 'tab-h3' }, 'Paraná: grupos do piso'),
      ui.listaResumo(Object.entries(pr.grupos).map(([g, v]) => ({
        rotulo: `Grupo ${g}`,
        detalhe: g === cfg.grupoPR ? (g === 'II' ? 'usado no cálculo (padrão)' : 'usado no cálculo (sua escolha)') : null,
        valorCentavos: v,
        grande: g === cfg.grupoPR,
      }))),
      h('p', { class: 'tab-obs' }, 'Troque o grupo em Mais, nas configurações.'))
    : null;

  const fontes = h('details', { class: 'tab-detalhes' },
    h('summary', { class: 'tab-detalhes-resumo' }, h('span', null, 'Fontes e observações de cada estado'), ui.icone('seta')),
    h('ul', { class: 'tab-fontes' }, linhas.map((l) => h('li', null,
      h('p', null, h('strong', null, l.uf === 'demais' ? 'Demais estados' : l.uf), ui.selosDoPasso(l).length ? ' ' : null, ui.selosDoPasso(l)),
      l.uf === 'demais' && l.ufs ? h('p', { class: 'tab-obs' }, l.ufs.join(', ')) : null,
      l.observacao ? h('p', { class: 'tab-obs' }, l.observacao) : null,
      l.fonte_url ? h('p', { class: 'tab-fonte' }, ui.linkExterno(l.fonte_url, l.lei || 'Fonte', { icone: ui.icone('externo', { tamanho: 'p', classe: 'icone--externo' }) })) : null))));

  ui.trocar(sec,
    ...tituloSecao('pisos', 'Pisos do doméstico por estado', `Onde há piso estadual, o cálculo usa o maior entre ele e o mínimo nacional (${minimo ? motor.formatarBRL(minimo.usado_no_calculo) : '—'}).`),
    cfg.uf ? null : h('p', { class: 'tab-obs' }, 'Para destacar o seu estado, escolha-o em ', h('a', { href: '#mais', class: 'tab-link-alvo' }, 'Mais → Configurações'), '.'),
    tab,
    grupos,
    ui.alertas(r.alertas),
    fontes);
}

// ═════════════ (4) Conversor ═════════════
const UNIDADES = [
  { valor: 'hora', texto: 'Hora', rotulo: 'Por hora' },
  { valor: 'dia', texto: 'Dia', rotulo: 'Por dia' },
  { valor: 'semana', texto: 'Semana', rotulo: 'Por semana' },
  { valor: 'mes', texto: 'Mês', rotulo: 'Por mês' },
  { valor: 'ano', texto: 'Ano', rotulo: 'Por ano' },
];

function diasSemanaPadrao() {
  const { motor } = estado.ctx;
  const j = motor.obterJornada(estado.ctx.dataReferencia(), estado.ctx.overrides());
  return Math.round((j.jornada / 8) * 100) / 100;
}

function montarConversor() {
  const { ui } = estado.ctx;
  const { h } = ui;
  const sec = estado.secoes.conversor;
  const c = {};
  estado.conv = c;
  const recalc = () => {
    if (c.timer) { clearTimeout(c.timer); estado.timers.delete(c.timer); }
    c.timer = agendar(recalcularConversor, 200);
  };
  c.valor = ui.campoDinheiro({ rotulo: 'Valor', valor: 1200, aoMudar: recalc, dica: 'Digite um valor e escolha a unidade dele.' });
  c.unidade = ui.segmentos({ rotulo: 'Esse valor é por', variante: 'livre', valor: 'hora', opcoes: UNIDADES.map((u) => ({ valor: u.valor, texto: u.texto })), aoMudar: recalcularConversor });
  c.horas = ui.campoNumero({ rotulo: 'Horas por dia', valor: 8, min: 0.5, max: 24, passo: 0.5, unidade: 'horas', aoMudar: recalc });
  c.dias = ui.campoNumero({ rotulo: 'Dias por semana', valor: diasSemanaPadrao(), min: 0.25, max: 7, passo: 0.25, unidade: 'dias', aoMudar: recalc,
    dica: 'O padrão é a jornada da lei ÷ 8 horas.' });
  c.metodo = ui.segmentos({
    rotulo: 'Como contar o mês', variante: 'livre', valor: 'legal',
    opcoes: [{ valor: 'legal', texto: 'Pela lei (com descanso)' }, { valor: 'calendario', texto: 'Pelo calendário' }],
    dica: 'Pela lei: o mês inclui o descanso semanal remunerado e o dia é o mês ÷ 30. Pelo calendário: 52 semanas ÷ 12 meses e o dia é um dia trabalhado.',
    aoMudar: recalcularConversor,
  });
  c.resultado = h('div', { class: 'tab-conv-resultado', 'aria-live': 'off' });
  c.premissa = h('p', { class: 'tab-premissa' });
  c.alertas = ui.alertas([]);
  sec.append(
    ...tituloSecao('conversor', 'Conversor', 'Passe um valor de hora para dia, semana, mês e ano, ou o contrário.'),
    h('div', { class: 'bloco--papel tab-papel tab-conv' },
      c.valor, c.unidade,
      h('div', { class: 'grade-2' }, c.horas, c.dias),
      c.metodo),
    c.resultado,
    c.premissa,
    c.alertas);
  recalcularConversor();
}

function recalcularConversor() {
  if (!estado || !estado.conv) return;
  const { ui, motor } = estado.ctx;
  const c = estado.conv;
  const valor = c.valor.lerCentavos();
  const unidade = c.unidade.valor;
  const horasDia = c.horas.lerValor();
  const diasSemana = c.dias.lerValor();
  if (valor === null || horasDia === null || diasSemana === null) {
    ui.trocar(c.resultado, ui.h('p', { class: 'texto-2' }, valor === null ? 'Digite um valor para converter.' : 'Confira as horas e os dias.'));
    ui.trocar(c.premissa);
    c.alertas.atualizar([]);
    return;
  }
  const r = motor.converterSalario({ valor, unidade, horasDia, diasSemana, metodo: c.metodo.valor, uf: estado.ctx.config.uf || undefined },
    estado.ctx.dataReferencia(), { overrides: estado.ctx.overrides() });
  const res = r.resultado;
  ui.trocar(c.resultado, ui.listaResumo([
    ...UNIDADES.map((u) => ({ rotulo: u.rotulo, detalhe: u.valor === unidade ? 'o valor digitado' : null, valorCentavos: res[u.valor], grande: u.valor === 'mes' })),
    { rotulo: 'Por ano com 13º e 1/3 de férias', detalhe: 'se for empregado com carteira', valorCentavos: res.ano_com_13_e_ferias },
  ]));
  const pHoras = r.passos.find((p) => p.id === 'horas_mes');
  ui.trocar(c.premissa,
    ui.h('strong', null, 'Premissa: '),
    pHoras ? `${pHoras.formula} por mês.` : '',
    c.metodo.valor === 'legal' ? ' Dia = mês ÷ 30.' : ' Dia = um dia trabalhado.');
  c.alertas.atualizar(r.alertas);
  if (c.jaCalculou) estado.ctx.anunciar(`Por mês: ${motor.formatarBRL(res.mes)}`);
  c.jaCalculou = true;
}

// ═════════════ (5) Tabelas oficiais ═════════════
function desenharOficiais() {
  const { ui, motor } = estado.ctx;
  const { h } = ui;
  const sec = estado.secoes.oficiais;
  const data = estado.ctx.dataReferencia();
  const ov = estado.ctx.overrides();
  const P = (chave, opcoes) => motor.getParam(chave, data, ov, opcoes) || motor.getParamComReserva(chave, data, ov);
  const brl = (c) => motor.formatarBRL(c);
  const pct = (n) => motor.formatarPct(n);
  const blocos = [];
  const bloco = (titulo, conteudo, param, { informativo = false } = {}) => h('section', { class: 'bloco--papel tab-papel tab-oficial', 'aria-label': titulo },
    h('h3', { class: 'tab-h3' }, titulo, informativo ? ' ' : null, informativo ? ui.selo('info', 'Só informação') : null),
    param && (param.editado_por_usuario || param.status !== 'vigente') ? h('div', { class: 'tab-selos' }, ui.selosDoPasso(param)) : null,
    param && param.fora_da_vigencia ? ui.alerta({ nivel: 'atencao', titulo: 'Tabela de outro período', texto: 'O app não tem a tabela desta data; mostra a vigência oficial mais próxima.' }) : null,
    conteudo,
    param && param.observacao ? h('p', { class: 'tab-obs' }, param.observacao) : null,
    fonte(param));

  // INSS do empregado e do doméstico
  const inss = P('inss_empregado');
  if (inss) {
    const faixas = inss.valor.faixas;
    const maxDesconto = motor.calcularInss({ salario: inss.valor.teto }, data, { overrides: ov }).resultado.inss;
    blocos.push(bloco('INSS do empregado e do doméstico', [
      ui.tabela({
        legenda: 'Desconto progressivo: cada parte do salário paga a alíquota da sua faixa.',
        colunas: [{ rotulo: 'Salário de contribuição' }, { rotulo: 'Alíquota', numerica: true }],
        linhas: faixas.map((f, i) => [
          i === 0 ? `Até ${brl(f.ate)}` : `De ${brl(faixas[i - 1].ate + 1)} até ${brl(f.ate)}`,
          pct(f.aliquota_pct),
        ]),
        zebra: true, classe: 'tab-tabela-quebra',
      }),
      ui.listaResumo([
        { rotulo: 'Teto (salário máximo de contribuição)', valorCentavos: inss.valor.teto },
        { rotulo: 'Desconto máximo', detalhe: 'soma das faixas no teto', valorCentavos: maxDesconto },
      ]),
    ], inss));
  }

  // IRRF mensal + redutor da Lei 15.270
  const ir = P('irrf_mensal');
  const red = P('irrf_redutor');
  if (ir) {
    const faixas = ir.valor.faixas;
    blocos.push(bloco('Imposto de renda (IRRF) por mês', [
      ui.tabela({
        legenda: 'Base de cálculo = rendimento menos as deduções (ou o desconto simplificado).',
        colunas: [{ rotulo: 'Base de cálculo' }, { rotulo: 'Alíquota', numerica: true }, { rotulo: 'Parcela a deduzir', numerica: true }],
        linhas: faixas.map((f, i) => [
          f.ate === null ? `Acima de ${brl(faixas[i - 1].ate)}` : i === 0 ? `Até ${brl(f.ate)}` : `De ${brl(faixas[i - 1].ate + 1)} até ${brl(f.ate)}`,
          f.aliquota_pct ? pct(f.aliquota_pct) : 'Isento',
          f.deducao ? brl(f.deducao) : '—',
        ]),
        zebra: true, empilhada: true,
      }),
      ui.listaResumo([
        { rotulo: 'Dedução por dependente', valorCentavos: ir.valor.dependente },
        { rotulo: 'Desconto simplificado', detalhe: 'no lugar das deduções, se for melhor', valorCentavos: ir.valor.desconto_simplificado },
        Number.isFinite(ir.valor.parcela_isenta_65) ? { rotulo: 'Parcela isenta de aposentados com 65 anos ou mais', valorCentavos: ir.valor.parcela_isenta_65 } : null,
      ].filter(Boolean)),
    ], ir));
  }
  if (red) {
    const v = red.valor;
    const fator = motor.formatarNumero(v.fator_milionesimos / 1e6, 6);
    blocos.push(bloco('Redução do imposto (Lei 15.270)', ui.listaResumo([
      { rotulo: `Rendimento até ${brl(v.limite_reducao_total)}`, detalhe: 'o imposto zera', texto: `redução de até ${brl(v.reducao_maxima)}` },
      { rotulo: `De ${brl(v.limite_reducao_total + 1)} até ${brl(v.limite_superior)}`, detalhe: `redução = ${brl(v.constante)} − ${fator} × rendimento bruto tributável`, texto: 'redução parcial' },
      { rotulo: `Acima de ${brl(v.limite_superior)}`, texto: 'sem redução' },
    ]), red));
  }

  // Encargos do empregador doméstico
  const enc = P('encargos_domestico');
  if (enc) {
    const e = enc.valor;
    const total = Math.round((e.cpp_pct + e.gilrat_pct + e.fgts_pct + e.indenizacao_pct) * 1000) / 1000;
    blocos.push(bloco('Encargos de quem emprega doméstico', [
      ui.tabela({
        legenda: 'Pagos por quem emprega, na guia DAE (do eSocial), junto com o INSS descontado do empregado.',
        colunas: [{ rotulo: 'Encargo' }, { rotulo: 'Alíquota', numerica: true }],
        linhas: [
          ['CPP (contribuição previdenciária)', pct(e.cpp_pct)],
          ['GILRAT (seguro contra acidente)', pct(e.gilrat_pct)],
          ['FGTS', pct(e.fgts_pct)],
          ['Indenização compensatória (multa do FGTS antecipada)', pct(e.indenizacao_pct)],
          [{ texto: 'Total', classe: 'tab-total' }, { texto: pct(total), classe: 'tab-total' }],
        ],
        zebra: true, classe: 'tab-tabela-quebra',
      }),
      inss ? h('p', { class: 'tab-obs' }, `CPP e GILRAT incidem até o teto do INSS (${brl(inss.valor.teto)}). FGTS e indenização incidem sobre a remuneração inteira.`) : null,
    ], enc));
  }

  // Autônomo
  const aut = P('autonomo');
  const ret = P('autonomo_retencao_empresa');
  if (aut) {
    const a = aut.valor;
    blocos.push(bloco('INSS de quem trabalha por conta própria (autônomo)', [
      ui.listaResumo([
        { rotulo: `Plano normal: ${pct(a.normal_pct)}`, detalhe: `sobre a renda, de ${brl(a.base_minima)} a ${brl(a.base_maxima)}`, texto: `${brl(motor.aplicarPct(a.base_minima, a.normal_pct))} a ${brl(motor.aplicarPct(a.base_maxima, a.normal_pct))}` },
        { rotulo: `Plano simplificado: ${pct(a.simplificado_pct)}`, detalhe: 'sobre o salário mínimo', valorCentavos: motor.aplicarPct(a.base_minima, a.simplificado_pct) },
        { rotulo: 'Vencimento', texto: `dia ${a.dia_recolhimento}` },
      ]),
      ret ? h('p', { class: 'tab-obs' }, `Se quem paga é uma empresa, ela desconta ${pct(ret.valor.aliquota_pct)} do valor (até o teto de ${brl(ret.valor.teto_base)}) e paga mais ${pct(ret.valor.patronal_pct)} por conta dela.`) : null,
    ], aut, { informativo: true }));
  }

  // MEI
  const das = P('mei_das');
  const lim = P('mei_limite_anual');
  const dia = P('mei_diarista');
  if (das || lim) {
    const futuros = motor.listarVigencias('mei_limite_anual', ov).filter((v) => lim && v.vigente_desde > lim.vigente_desde);
    blocos.push(bloco('MEI (microempreendedor individual)', [
      das ? ui.listaResumo([
        { rotulo: 'DAS: parte do INSS', valorCentavos: das.valor.inss },
        { rotulo: 'Mais ICMS', detalhe: 'comércio ou indústria', valorCentavos: das.valor.icms },
        { rotulo: 'Mais ISS', detalhe: 'serviços, como diarista', valorCentavos: das.valor.iss },
      ]) : null,
      lim ? ui.listaResumo([{ rotulo: 'Limite de receita por ano', detalhe: lim.vigente_ate ? `até ${dataBR(lim.vigente_ate)}` : null, valorCentavos: lim.valor }]) : null,
      futuros.length ? h('ul', { class: 'tab-futuros' }, futuros.map((v) => h('li', null,
        ui.selosDoPasso(v), ' ',
        `A partir de ${dataBR(v.vigente_desde)}: ${brl(v.valor)} por ano.`,
        v.observacao ? h('span', { class: 'tab-obs' }, ` ${v.observacao}`) : null))) : null,
      dia && dia.valor && dia.valor.permitido ? h('p', { class: 'tab-obs' }, `Diarista pode ser MEI (atividade ${dia.valor.cnae}). Ser MEI não impede que o trabalho seja visto como emprego doméstico.`) : null,
      lim ? fonte(lim) : null,
    ], das, { informativo: true }));
  }

  ui.trocar(sec,
    ...tituloSecao('oficiais', 'Tabelas oficiais', `Em vigor em ${dataBR(data)}, com a fonte de cada uma.`),
    blocos);
}
