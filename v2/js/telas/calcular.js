// Tabela de Ganhos v2 — tela "Calcular": modos Por hora, Diarista e Doméstico.
// Contrato: docs/ARQUITETURA-UI.md. O resultado atualiza enquanto a pessoa digita (sem botão "Calcular").
// Submódulos em js/telas/calcular/: um por modo, o questionário e as ações (salvar, compartilhar, copiar).
import * as modoPorHora from './calcular/porHora.js';
import * as modoDiarista from './calcular/diarista.js';
import * as modoDomestico from './calcular/domestico.js';
import { abrirQuestionario } from './calcular/questionario.js';
import { abrirSalvar, abrirCompartilhar, copiarResultado } from './calcular/acoes.js';
import { adiar, dataBR, lerLembranca, gravarLembranca, EXEMPLOS, entradaExemplo } from './calcular/util.js';

const FABRICAS = Object.freeze(Object.assign(Object.create(null), { porHora: modoPorHora, diarista: modoDiarista, domestico: modoDomestico }));
/** Só os 3 modos (um link com ?modo=constructor ou __proto__ não pode passar). */
const modoValido = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(FABRICAS, id);
const MODOS = [
  { valor: 'porHora', texto: 'Por hora' },
  { valor: 'diarista', texto: 'Diarista' },
  { valor: 'domestico', texto: 'Doméstico' },
];
const MS_CALCULO = 140;   // espera curta depois da tecla
const MS_ANUNCIO = 800;   // leitor de tela: fala o resultado quando a pessoa para de digitar

let tela = null;

/** @param {HTMLElement} raiz  @param {object} ctx */
export async function montar(raiz, ctx) {
  await ctx.carregarCss('css/telas/calcular.css');
  tela = criarTela(raiz, ctx);
  await tela.iniciar(ctx.rota);
}

export function desmontar() {
  if (tela) tela.desmontar();
  tela = null;
}

/** Mesma tela, outra rota (ex.: #calcular?salvo=id vindo de Salvos, ?modo= vindo de Leis, ou a limpeza do hash depois de abrir um link). */
export async function aoMudarRota(rota) {
  if (tela) await tela.aoMudarRota(rota);
}

function criarTela(raiz, ctx) {
  const { ui, motor } = ctx;
  const S = {
    modos: Object.create(null),   // instâncias criadas (guardam os valores ao trocar de modo)
    atual: null,         // instância do modo à mostra
    dataFixa: null,      // data vinda de link ou salvo (null = data de referência do app)
    origemData: null,    // 'link' | 'salvo'
    salvoAberto: null,   // salvo aberto (para "atualizar o salvo")
    ultimo: null,        // último resultado calculado
    falar: false,        // anunciar só depois de a pessoa mexer
    alertas: [],         // alertas à mostra (o leitor de tela fala os de risco junto com o total)
  };

  const dataCalculo = () => S.dataFixa || ctx.dataReferencia();

  // ───── Estrutura ─────
  const seletor = ui.segmentos({
    rotulo: 'Modo de cálculo', variante: 'colado', valor: null, opcoes: MODOS,
    aoMudar: (v) => trocarModo(v, { focar: false }),
  });
  const naoSei = ui.botao({
    texto: 'Não sei qual é o meu', variante: 'texto', classe: 'calc-naosei',
    aoClicar: () => abrirQuestionario(ctx, { dataISO: dataCalculo(), aoEscolher: (m) => trocarModo(m, { focar: true }) }),
  });
  const notaExemplo = ui.h('p', { class: 'calc-exemplo-nota', 'aria-live': 'polite', hidden: true });
  const exemplos = ui.h('details', { class: 'calc-mais calc-exemplos' },
    ui.h('summary', { class: 'calc-mais-resumo' }, ui.h('span', null, 'Exemplos de trabalho'), ui.icone('seta')),
    ui.h('div', { class: 'calc-mais-corpo pilha pilha--curta' },
      ui.h('p', { class: 'campo-dica', id: 'calc-exemplos-dica' }, 'Preenchem horas e dias. O valor vem no mínimo legal, para você trocar pelo combinado.'),
      ui.h('div', { class: 'chips', role: 'group', 'aria-label': 'Exemplos de trabalho', 'aria-describedby': 'calc-exemplos-dica' },
        EXEMPLOS.map((x) => ui.h('button', { type: 'button', class: 'chip', dataset: { exemplo: x.id }, on: { click: () => aplicarExemplo(x) } }, x.nome)))),
  );

  const avisoOrigem = ui.h('div', { class: 'calc-origem', hidden: true });
  const camposTitulo = ui.h('h2', { class: 'sr', id: 'calc-dados-titulo' }, 'Dados do cálculo');
  const caixaCampos = ui.h('div', { class: 'calc-dados' });
  const blocoCampos = ui.h('section', { class: 'bloco calc-bloco-dados', 'aria-labelledby': 'calc-dados-titulo' }, camposTitulo, caixaCampos);
  const caixaResultado = ui.h('div', { class: 'calc-resultado' });
  const selos = ui.h('div', { class: 'calc-selos' });
  const avisos = ui.alertas([]);
  const caixaExtras = ui.h('div', { class: 'calc-extras' });
  const caixaConta = ui.h('div', { class: 'calc-conta' });
  let cartao = null;
  let conta = null;

  // Resumo fixo acima das abas: aparece quando o cartão do resultado está mais abaixo, fora da tela
  // (o caso comum em Diarista e Doméstico, ainda mais com o teclado aberto). Um toque leva ao resultado.
  const resumoValor = ui.h('span', { class: 'calc-resumo-fixo-valor' });
  const resumoFixo = ui.h('button', {
    type: 'button', class: 'calc-resumo-fixo', hidden: true,
    on: { click: () => irParaResultado() },
  }, resumoValor, ui.h('span', { class: 'calc-resumo-fixo-ver' }, 'Ver conta', ui.icone('seta', { tamanho: 'p' })));
  let resultadoAbaixo = false;
  const observador = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(([e]) => {
      // Abaixo da área visível (e não acima, quando a pessoa já passou dele).
      resultadoAbaixo = !e.isIntersecting && e.boundingClientRect.top > 0;
      mostrarResumoFixo();
    }, { rootMargin: '0px 0px -120px 0px' })
    : null;

  raiz.append(ui.h('section', { class: 'tela', 'aria-labelledby': 'titulo-tela' },
    ui.cabecalhoTela({ titulo: 'Calcular', sub: 'Quanto custa pagar por hora, por dia ou por mês.' }),
    ui.h('div', { class: 'bloco calc-topo' }, seletor, naoSei, exemplos),
    avisoOrigem,
    notaExemplo,
    blocoCampos,
    ui.h('div', { class: 'calc-saida' }, caixaResultado, selos, avisos, caixaConta, caixaExtras),
    resumoFixo));
  if (observador) observador.observe(caixaResultado);

  function mostrarResumoFixo() {
    const out = S.ultimo;
    const temValor = !!out && !out.faltando && Number.isFinite(out.cartao && out.cartao.valorCentavos);
    const mostrar = temValor && resultadoAbaixo;
    if (temValor) {
      const risco = S.alertas.some((a) => a.nivel === 'risco');
      ui.trocar(resumoValor, `${out.resumo.rotulo}: `, ui.h('strong', null, motor.formatarBRL(out.cartao.valorCentavos)), risco ? ' · com alerta' : '');
    }
    resumoFixo.hidden = !mostrar;
    document.documentElement.classList.toggle('tg-resumo-fixo', mostrar);
  }

  function irParaResultado() {
    const alvo = cartao && cartao.querySelector('.resultado-titulo');
    caixaResultado.scrollIntoView({ block: 'start' });
    if (alvo) { alvo.setAttribute('tabindex', '-1'); alvo.focus({ preventScroll: true }); }
  }

  // ───── Cálculo ─────
  const agendar = adiar(() => recalcular(), MS_CALCULO);
  const anunciarDepois = adiar(() => { if (S.ultimo && !S.ultimo.faltando) ctx.anunciar(textoAnuncio(S.ultimo)); }, MS_ANUNCIO);

  /** Total falado + o título dos alertas de risco (quem não vê a tela precisa saber do risco, WCAG 4.1.3). */
  function textoAnuncio(out) {
    const riscos = S.alertas.filter((a) => a.nivel === 'risco' && a.titulo).map((a) => a.titulo.replace(/[.!]+$/, ''));
    return riscos.length ? `${out.anuncio}. Atenção: ${riscos.join('; ')}.` : out.anuncio;
  }
  const lembrarDepois = adiar(() => lembrar(), 600);

  const api = {
    aoMudar: (imediato = false) => {
      S.falar = true;
      notaExemplo.hidden = true;
      if (imediato) { agendar.cancelar(); recalcular(); } else agendar();
    },
    dataCalculo,
    trocarModo: (m) => trocarModo(m, { focar: true }),
  };

  function instancia(id) {
    if (!modoValido(id)) id = 'porHora';
    if (!S.modos[id]) S.modos[id] = FABRICAS[id].criar(ctx, api);
    return S.modos[id];
  }

  function trocarModo(id, { focar = false, calcular = true } = {}) {
    if (!modoValido(id)) id = 'porHora';
    const m = instancia(id);
    S.atual = m;
    seletor.definir(id);
    ui.trocar(caixaCampos, m.campos);
    ui.trocar(caixaExtras, m.extras || []);
    cartao = ui.cartaoResultado({
      titulo: 'Resultado', valorCentavos: null,
      acoes: [
        { texto: 'Salvar', icone: 'guardar', aoClicar: salvar },
        { texto: 'Compartilhar', icone: 'compartilhar', aoClicar: compartilhar },
        { texto: 'Copiar resultado', icone: 'copiar', aoClicar: copiar },
        { texto: 'Imprimir', icone: 'imprimir', aoClicar: () => window.print() },
      ],
    });
    ui.trocar(caixaResultado, cartao);
    conta = ui.listaConta([], { idsTotal: m.idsTotal, idsDesconto: m.idsDesconto });
    ui.trocar(caixaConta, conta);
    gravarLembranca(ctx, { modo: id });
    if (calcular) recalcular();
    if (focar) {
      const alvo = m.focoInicial && m.focoInicial();
      if (alvo) alvo.focus();
      ctx.anunciar(`Modo ${ctx.nomes.modo[id]}`);
    }
  }

  function recalcular() {
    const m = S.atual;
    if (!m) return;
    const data = dataCalculo();
    let out;
    try {
      out = m.calcular(data);
    } catch (e) {
      console.error(e);
      cartao.atualizar({ valorCentavos: null, vazio: 'Não deu para calcular. Confira os números.' });
      S.ultimo = null;
      mostrarResumoFixo();
      return;
    }
    S.ultimo = out;
    const vazio = !!out.faltando;
    caixaResultado.classList.toggle('calc-resultado--vazio', vazio);
    cartao.atualizar({ ...out.cartao, valorCentavos: vazio ? null : out.cartao.valorCentavos, vazio: out.faltando, linhas: vazio ? [] : out.cartao.linhas });
    conta.atualizar(vazio ? [] : [...(out.passosAntes || []), ...out.r.passos]);
    conta.hidden = vazio;
    // "Falta o valor" não aparece como alerta enquanto o campo está vazio: o cartão já pede.
    const lista = (out.alertas || out.r.alertas).filter((a) => !(a.codigo === 'entrada_invalida' && (out.vazios || []).includes(a.campo)));
    avisos.atualizar(lista);
    S.alertas = lista;
    mostrarResumoFixo();
    desenharSelos(data, lista);
    if (m.atualizarExtras) m.atualizarExtras(data, out);
    if (S.falar) anunciarDepois();
    lembrarDepois();
  }

  function desenharSelos(data, lista) {
    const itens = [];
    const fixadaEmMais = !S.dataFixa && ctx.config.dataReferencia !== 'auto';
    const origem = S.origemData === 'link' ? ' (data do link)' : S.origemData === 'salvo' ? ' (data do salvo)' : fixadaEmMais ? ' (fixada em Mais)' : '';
    itens.push(ui.selo('info', `Conta de ${dataBR(data)}${origem}`));
    for (const a of lista) {
      if (/^mudanca_jornada/.test(a.codigo)) itens.push(ui.selo('previsto', a.titulo));
      if (a.codigo === 'jornada_42_liminar') itens.push(ui.selo('previsto', 'Jornada de 42 h (liminar do STF)'));
    }
    if (S.dataFixa && S.dataFixa !== ctx.dataReferencia()) {
      itens.push(ui.botao({ texto: 'Usar a data de hoje', variante: 'texto', classe: 'calc-selos-botao', aoClicar: usarDataDeHoje }));
    }
    ui.trocar(selos, itens);
  }

  function usarDataDeHoje() {
    S.dataFixa = null;
    S.origemData = null;
    avisoOrigem.hidden = true;
    recalcular();
    ctx.anunciar(`Conta refeita com a data de ${dataBR(dataCalculo())}`);
  }

  // ───── Lembrar e reabrir ─────
  function lembrar() {
    if (!S.atual) return;
    gravarLembranca(ctx, { modo: S.atual.id, [S.atual.id]: S.atual.lerEntrada() });
  }

  function aplicarExemplo(x) {
    const data = dataCalculo();
    const { entrada, valorTexto } = entradaExemplo(x.id, ctx, data, data.slice(0, 7));
    trocarModo(x.modo, { calcular: false });
    S.atual.aplicarExemplo(entrada);
    S.falar = true;
    recalcular();
    ui.trocar(notaExemplo, ui.selo('exemplo'), ' ', ui.h('strong', null, x.nome), `: ${x.descricao}. Valor: ${valorTexto}. Troque pelo valor combinado.`);
    notaExemplo.hidden = false;
  }

  function mostrarAviso(no) {
    ui.trocar(avisoOrigem, no);
    avisoOrigem.hidden = !no;
  }

  function abrirEstado({ modo, entrada, data }, { origem, salvo = null }) {
    const id = modo === 'inverso' ? 'porHora' : modo;
    trocarModo(id, { calcular: false });
    S.atual.preencher(entrada || {});
    S.dataFixa = data || null;
    S.origemData = data ? origem : null;
    S.salvoAberto = salvo;
    recalcular();
  }

  async function abrirSalvo(id) {
    const salvo = await ctx.armazem.obterSalvo(id);
    if (!salvo) { ctx.toast('Este cálculo salvo não foi encontrado.'); return false; }
    abrirEstado({ modo: salvo.modo, entrada: salvo.entrada, data: salvo.data_referencia }, { origem: 'salvo', salvo });
    const valorAntes = Number.isFinite(salvo.resumo && salvo.resumo.valor_centavos) ? motor.formatarBRL(salvo.resumo.valor_centavos) : null;
    if (salvo.parametros_versao !== motor.PARAMETROS_VERSAO) {
      mostrarAviso(ui.alerta({
        nivel: 'atencao', codigo: 'versao_salvo',
        titulo: `Este cálculo usou os valores de ${dataBR(salvo.parametros_versao) || salvo.parametros_versao}`,
        texto: `Os valores da lei foram atualizados em ${dataBR(motor.PARAMETROS_VERSAO)}.${valorAntes ? ` Quando foi salvo, o resultado era ${valorAntes}.` : ''} Recalcular com os valores e a data de hoje?`,
        acoes: [{ texto: 'Recalcular com os atuais', aoClicar: usarDataDeHoje }],
      }));
    } else {
      mostrarAviso(ui.alerta({
        nivel: 'info', codigo: 'salvo_aberto',
        titulo: `Salvo aberto: ${salvo.titulo}`,
        texto: `Conta com a data em que foi salvo (${dataBR(salvo.data_referencia) || 'hoje'}). Para guardar mudanças, toque em Salvar.`,
      }));
    }
    return true;
  }

  function abrirLink(compartilhado) {
    if (!compartilhado.ok) {
      ctx.toast(compartilhado.erro || 'O link está incompleto ou foi alterado.');
      return false;
    }
    abrirEstado(compartilhado.estado, { origem: 'link' });
    mostrarAviso(ui.alerta({
      nivel: 'info', codigo: 'link_aberto', titulo: 'Cálculo aberto por um link',
      texto: 'Os números vieram do link. Confira antes de usar. Nada foi salvo neste aparelho.',
    }));
    return true;
  }

  // ───── Ações ─────
  function prontoParaAcao() {
    if (!S.ultimo || S.ultimo.faltando) {
      ctx.toast(S.ultimo && S.ultimo.faltando ? `${S.ultimo.faltando} primeiro.` : 'Preencha os dados primeiro.');
      return false;
    }
    return true;
  }

  async function salvar() {
    if (!prontoParaAcao()) return;
    const out = S.ultimo;
    const gravado = await abrirSalvar(ctx, {
      modo: S.atual.id, entrada: S.atual.lerEntrada(), data: dataCalculo(), resumo: out.resumo,
      tituloSugerido: `${ctx.nomes.modo[S.atual.id]}: ${out.resumo.rotulo.toLowerCase()}`,
      salvoAberto: S.salvoAberto && S.salvoAberto.modo === S.atual.id ? S.salvoAberto : null,
    });
    if (gravado) S.salvoAberto = gravado;
  }

  function compartilhar() {
    if (!prontoParaAcao()) return;
    abrirCompartilhar(ctx, { modo: S.atual.id, entrada: S.atual.lerEntrada(), data: dataCalculo(), compart: S.ultimo.compart });
  }

  function copiar() {
    if (!prontoParaAcao()) return;
    copiarResultado(ctx, { data: dataCalculo(), compart: S.ultimo.compart });
  }

  // ───── Configuração mudou (UF, data, arredondamento, overrides…) ─────
  const ouvirConfig = (e) => {
    const mudou = e.detail.mudou || [];
    // A config guardada chegou depois da abertura (armazenamento lento): se a pessoa ainda não mexeu,
    // reabre o modo e os valores lembrados, que a config provisória não tinha.
    if (e.detail.tarde && !S.falar && !S.salvoAberto && !S.dataFixa) {
      restaurarLembranca();
      recalcular();
      return;
    }
    if (mudou.includes('uf') || mudou.includes('grupoPR')) {
      Object.values(S.modos).forEach((m) => m.aoMudarConfig && m.aoMudarConfig(e.detail.config));
    }
    if (['uf', 'grupoPR', 'dataReferencia', 'arredondamento', 'overrides'].some((k) => mudou.includes(k))) recalcular();
  };
  window.addEventListener('tg:config', ouvirConfig);

  /** Lê os parâmetros da rota: ?salvo=id (Salvos, Leis), ?modo=… (Leis) e ?de=tabela&… (Tabela). */
  async function abrirPelaRota(params) {
    let aberto = false;
    let limpar = false;
    if (params.get('salvo')) {
      aberto = await abrirSalvo(params.get('salvo'));
      limpar = true;
    } else if (params.get('de') === 'tabela') {
      aberto = abrirDaTabela(params);
      limpar = true;
    } else if (params.get('modo')) {
      const m = params.get('modo') === 'inverso' ? 'porHora' : params.get('modo');
      if (modoValido(m)) { trocarModo(m, { calcular: true }); aberto = true; }
      limpar = true;
    }
    if (limpar) limparHash();
    return aberto;
  }

  /** Toque numa célula da Tabela: valor por hora (centavos), horas por dia e dias no mês. */
  function abrirDaTabela(params) {
    const num = (k, min, max, inteiro) => {
      const t = params.get(k);
      if (t === null || !/^\d{1,9}(\.\d{1,4})?$/.test(t)) return null;
      const n = Number(t);
      return n >= min && n <= max && (!inteiro || Number.isInteger(n)) ? n : null;
    };
    const valorHora = num('valorHora', 1, 100000000, true);
    const horasDia = num('horasDia', 0.25, 24, false);
    const dias = num('dias', 1, 31, true);
    if (valorHora === null || horasDia === null || dias === null) {
      ctx.toast('Não deu para trazer os números da tabela.');
      return false;
    }
    // Sem data própria: a conta usa a mesma data da Tabela (hoje ou a fixada em Mais).
    abrirEstado({ modo: 'porHora', entrada: { valorHora, horasDia, dias }, data: null }, { origem: null });
    mostrarAviso(ui.alerta({
      nivel: 'info', codigo: 'vindo_da_tabela', titulo: 'Números vindos da Tabela',
      texto: `${motor.formatarBRL(valorHora)} por hora, ${String(horasDia).replace('.', ',')} ${horasDia === 1 ? 'hora' : 'horas'} por dia, ${dias} ${dias === 1 ? 'dia' : 'dias'} no mês. Mude o que quiser aqui.`,
    }));
    return true;
  }

  // Tira o #c=… / ?salvo= do endereço depois de aplicado (sem entrada nova no histórico).
  // Espera a montagem terminar: o roteador só registra a tela depois que montar() resolve.
  function limparHash() { setTimeout(() => { if (tela) ctx.navegar('#calcular', { substituir: true }); }, 0); }

  /** Valores lembrados de cada modo (só números, neste aparelho; ficam na config: config.calcular) e o modo. */
  function restaurarLembranca() {
    const memoria = lerLembranca(ctx);
    for (const id of Object.keys(FABRICAS)) {
      if (memoria[id] && typeof memoria[id] === 'object') instancia(id).preencher(memoria[id]);
    }
    // Volta no modo em que a pessoa estava (ao trocar de aba ou reabrir); sem lembrança, o modo inicial de Mais.
    const inicial = ctx.config.padroes.modoInicial;
    trocarModo(modoValido(memoria.modo) ? memoria.modo : (inicial === 'inverso' ? 'porHora' : inicial), { calcular: false });
  }

  return {
    async iniciar(rota) {
      restaurarLembranca();

      let aberto = false;
      if (rota && rota.compartilhado) {
        aberto = abrirLink(rota.compartilhado);
        limparHash();
      } else if (rota && rota.params) {
        aberto = await abrirPelaRota(rota.params);
      }
      if (!aberto) recalcular();
    },

    async aoMudarRota(rota) {
      if (!rota.params) return;
      const tratou = ['salvo', 'modo', 'de'].some((k) => rota.params.has(k));
      if (!tratou) return;
      await abrirPelaRota(rota.params);
      document.getElementById('titulo-tela')?.focus({ preventScroll: true });
    },

    desmontar() {
      window.removeEventListener('tg:config', ouvirConfig);
      if (observador) observador.disconnect();
      document.documentElement.classList.remove('tg-resumo-fixo');
      agendar.cancelar();
      anunciarDepois.cancelar();
      lembrarDepois.cancelar();
      lembrar();
    },
  };
}
