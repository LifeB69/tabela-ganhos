// Tabela de Ganhos v2 — tela Calcular, modo "Por hora": valor/hora × horas/dia × dias,
// mais o bloco "Quanto posso pagar" (modo inverso do motor).
import { opcoesMeses, garantirOpcao, nomeMes, mesCurto, mesValido, semVazios, numeroDe } from './util.js';

const NOMES_DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const plural = (n, um, varios) => (n === 1 ? um : varios);

/**
 * @param {object} ctx contexto do app
 * @param {{ aoMudar: (imediato?: boolean) => void, dataCalculo: () => string }} api
 */
export function criar(ctx, api) {
  const { ui, motor } = ctx;
  const cfg = ctx.config;
  const hoje = api.dataCalculo();
  const mesHoje = hoje.slice(0, 7);
  const mudou = () => api.aoMudar();

  const valorHora = ui.campoDinheiro({
    rotulo: 'Valor por hora', valor: cfg.padroes.valorHora || null,
    dica: 'O valor combinado por hora de trabalho.', aoMudar: mudou,
  });
  const horasDia = ui.campoNumero({ rotulo: 'Horas por dia', valor: cfg.padroes.horasDia, min: 0.5, max: 24, passo: 0.5, unidade: 'horas', aoMudar: mudou });

  const forma = ui.segmentos({
    rotulo: 'Como contar os dias', variante: 'igual', valor: 'semana',
    opcoes: [{ valor: 'semana', texto: 'Dias da semana' }, { valor: 'mes', texto: 'Total de dias' }],
    aoMudar: () => { mostrarForma(); api.aoMudar(true); },
  });
  const diasSemana = ui.seletorDias({ rotulo: 'Dias de trabalho', valor: cfg.padroes.diasSemana, aoMudar: () => api.aoMudar(true) });
  const mes = ui.campoSelecao({
    rotulo: 'Mês de referência', largo: true,
    opcoes: [...opcoesMeses(hoje), { valor: 'media', texto: 'Média de um mês (52 semanas ÷ 12)' }],
    valor: mesHoje,
    dica: 'Conta quantas vezes cada dia marcado cai no mês. Feriados não são descontados.',
    aoMudar: () => api.aoMudar(true),
  });
  const diasMes = ui.campoNumero({ rotulo: 'Dias no mês', valor: 10, min: 0, max: 31, passo: 1, unidade: 'dias', aoMudar: mudou });

  const blocoSemana = ui.h('div', { class: 'calc-campos' }, diasSemana, mes);
  const blocoMes = ui.h('div', { class: 'calc-campos' }, diasMes);
  function mostrarForma() {
    blocoSemana.hidden = forma.valor !== 'semana';
    blocoMes.hidden = forma.valor !== 'mes';
  }
  mostrarForma();

  const campos = ui.h('div', { class: 'calc-campos' },
    valorHora,
    ui.h('div', { class: 'grade-2' }, horasDia),
    forma, blocoSemana, blocoMes);

  // ───── Quanto posso pagar (inverso) ─────
  const orcamento = ui.campoDinheiro({
    rotulo: 'Quanto você quer gastar no mês', largo: true,
    dica: 'Usa o valor por hora, as horas por dia e os dias de cima.', aoMudar: mudou,
  });
  const resumoInverso = ui.h('div', { class: 'calc-inverso-resultado' });
  const contaInverso = ui.listaConta([], { titulo: 'Mostrar a conta do orçamento' });
  const extras = ui.h('section', { class: 'bloco bloco--papel calc-inverso', 'aria-labelledby': 'calc-inverso-titulo' },
    ui.h('h2', { class: 'bloco-titulo', id: 'calc-inverso-titulo' }, 'Quanto posso pagar'),
    ui.h('p', { class: 'bloco-sub' }, 'Do seu orçamento para as horas e os dias que cabem nele.'),
    orcamento, resumoInverso, contaInverso);

  /** Dias do período conforme a forma escolhida: { dias?, diasSemana?, passo?, texto } */
  function lerDias() {
    if (forma.valor === 'mes') {
      const n = diasMes.lerValor();
      return { dias: n, texto: n === null ? '' : `${motor.formatarNumero(n)} ${plural(n, 'dia', 'dias')}`, rotuloMeta: 'no mês' };
    }
    const marcados = diasSemana.valor;
    if (!marcados.length) return { vazio: true };
    if (mes.input.value === 'media') {
      const media = Math.round(marcados.length * 52 / 12 * 100) / 100;
      return { diasSemana: marcados.length, diasMedia: media, texto: `${motor.formatarNumero(media, 2)} dias (média)`, rotuloMeta: 'média do mês' };
    }
    const m = mesValido(mes.input.value) ? mes.input.value : mesHoje;
    const c = motor.contarDiasDaSemanaNoMes(m, marcados);
    const lista = Object.entries(c.porDia).map(([k, v]) => `${v} ${NOMES_DIAS[k]}${v === 1 ? '' : 's'}`).join(' + ');
    return {
      dias: c.total, mes: m,
      texto: `${c.total} ${plural(c.total, 'dia', 'dias')}`,
      rotuloMeta: mesCurto(m),
      passo: { id: 'dias_mes', rotulo: `Dias de trabalho em ${nomeMes(m)}`, formula: `${lista} = ${c.total} ${plural(c.total, 'dia', 'dias')} (feriados não descontados)`, valor: null, unidade: 'dias' },
    };
  }

  /** Entrada para salvar e compartilhar (nomes de campo do motor). */
  function lerEntrada() {
    const e = { valorHora: valorHora.lerCentavos(), horasDia: horasDia.lerValor() };
    if (forma.valor === 'mes') e.dias = diasMes.lerValor();
    else {
      e.diasDaSemana = diasSemana.valor;
      if (mes.input.value !== 'media') e.mes = mes.input.value;
    }
    e.orcamento = orcamento.lerCentavos();
    return semVazios(e);
  }

  function preencher(e = {}) {
    valorHora.definir(e.valorHora ?? null);
    const h = numeroDe(e.horasDia);
    if (h !== null) horasDia.definir(h);
    if (Array.isArray(e.diasDaSemana)) {
      forma.definir('semana');
      diasSemana.definir(e.diasDaSemana);
      if (mesValido(e.mes)) { garantirOpcao(mes.input, e.mes, nomeMes(e.mes)); mes.input.value = e.mes; } else mes.input.value = 'media';
    } else if (numeroDe(e.dias) !== null) {
      forma.definir('mes');
      diasMes.definir(numeroDe(e.dias));
    } else if (numeroDe(e.diasSemana) !== null) {
      // salvo antigo / link com "dias por semana" sem os dias marcados: marca os primeiros dias úteis
      forma.definir('semana');
      const n = Math.max(0, Math.min(7, Math.round(numeroDe(e.diasSemana))));
      diasSemana.definir([1, 2, 3, 4, 5, 6, 0].slice(0, n));
      mes.input.value = 'media';
    }
    orcamento.definir(e.orcamento ?? null);
    mostrarForma();
  }

  function calcular(data) {
    const vh = valorHora.lerCentavos();
    const hd = horasDia.lerValor();
    const d = lerDias();
    const vazios = [];
    let faltando = null;
    if (vh === null) { vazios.push('valorHora'); faltando = 'Preencha o valor por hora'; }
    if (hd === null) { vazios.push('horasDia'); faltando = faltando || 'Preencha as horas por dia'; }
    if (d.vazio || (d.dias === null && d.diasSemana === undefined)) { vazios.push('dias'); faltando = faltando || (forma.valor === 'mes' ? 'Preencha os dias no mês' : 'Marque os dias de trabalho'); }

    const entradaMotor = { valorHora: vh, horasDia: hd };
    if (d.diasSemana !== undefined) entradaMotor.diasSemana = d.diasSemana;
    else entradaMotor.dias = d.dias;
    const r = motor.calcularPorHora(semVazios(entradaMotor), data, { arredondamento: ctx.arredondamentoCentavos(), overrides: ctx.overrides(), uf: ctx.config.uf || null });
    const res = r.resultado;
    const passosAntes = d.passo ? [d.passo] : [];
    const titulo = d.rotuloMeta === 'média do mês' ? 'Total médio do mês' : d.mes ? `Total em ${nomeMes(d.mes)}` : 'Total do mês';
    const horasTexto = `${motor.formatarNumero(res.horas_mes, 2)} h`;
    return {
      r, faltando, vazios, passosAntes,
      cartao: {
        titulo, meta: d.rotuloMeta, valorCentavos: res.total, extenso: false,
        linhas: [
          { rotulo: 'Valor por dia', detalhe: hd !== null ? `${motor.formatarNumero(hd)} h × valor por hora` : null, valorCentavos: res.valor_dia },
          { rotulo: 'Horas no mês', texto: horasTexto },
          { rotulo: 'Dias', texto: d.texto || '—' },
        ],
      },
      resumo: { rotulo: titulo, valor_centavos: res.total },
      compart: {
        titulo: `Por hora: ${titulo.toLowerCase()}`,
        linhas: [
          { rotulo: 'Valor por hora', valor_centavos: vh },
          { rotulo: 'Horas por dia', texto: hd === null ? '—' : motor.formatarNumero(hd) },
          { rotulo: 'Dias', texto: d.texto || '—' },
          { rotulo: 'Horas no mês', texto: horasTexto },
          { rotulo: 'Valor por dia', valor_centavos: res.valor_dia },
          { rotulo: titulo, valor_centavos: res.total },
        ],
      },
      anuncio: `${titulo}: ${motor.formatarBRL(res.total)}`,
      contexto: { valorHora: vh, horasDia: hd, dias: d.dias ?? d.diasMedia ?? null },
    };
  }

  /** Atualiza o bloco "Quanto posso pagar" com o último cálculo. */
  function atualizarExtras(data, out) {
    const orc = orcamento.lerCentavos();
    const { valorHora: vh, horasDia: hd, dias } = out.contexto;
    if (orc === null || !vh) {
      ui.trocar(resumoInverso, ui.h('p', { class: 'texto-2' }, !vh ? 'Preencha o valor por hora acima.' : 'Escreva quanto quer gastar para ver as horas que cabem.'));
      contaInverso.hidden = true;
      return;
    }
    const ri = motor.calcularPorHoraInverso(semVazios({ orcamento: orc, valorHora: vh, dias: dias || null, horasDia: hd }), data, { overrides: ctx.overrides() });
    const x = ri.resultado;
    const linhas = [{ rotulo: 'Horas que cabem', detalhe: 'arredondado para baixo', texto: `${motor.formatarNumero(x.horas, 2)} h`, grande: true }];
    if (x.horas_por_dia !== null) linhas.push({ rotulo: 'Horas por dia', detalhe: `nos ${Number.isInteger(dias) ? dias : motor.formatarNumero(dias, 2)} dias de cima`, texto: `${motor.formatarNumero(x.horas_por_dia, 2)} h` });
    if (x.dias_inteiros !== null) linhas.push({ rotulo: 'Dias inteiros', detalhe: `de ${motor.formatarNumero(hd)} h`, texto: `${x.dias_inteiros} ${plural(x.dias_inteiros, 'dia', 'dias')}` });
    linhas.push({ rotulo: 'Sobra', valorCentavos: x.sobra });
    ui.trocar(resumoInverso, ui.listaResumo(linhas));
    contaInverso.atualizar(ri.passos);
    contaInverso.hidden = false;
  }

  function aplicarExemplo(entrada) { preencher({ ...entrada, orcamento: orcamento.lerCentavos() ?? undefined }); }

  return {
    id: 'porHora', campos, extras, lerEntrada, preencher, calcular, atualizarExtras, aplicarExemplo,
    idsTotal: ['total'], idsDesconto: [],
    focoInicial: () => valorHora.input,
  };
}
