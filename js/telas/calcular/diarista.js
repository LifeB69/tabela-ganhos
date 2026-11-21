// Tabela de Ganhos v2 — tela Calcular, modo "Diarista" (sem vínculo, até 2 dias por semana na mesma casa).
import { opcoesMeses, garantirOpcao, nomeMes, mesCurto, mesValido, semVazios, numeroDe } from './util.js';

const plural = (n, um, varios) => (n === 1 ? um : varios);

/**
 * @param {object} ctx contexto do app
 * @param {{ aoMudar: (imediato?: boolean) => void, dataCalculo: () => string, trocarModo: (id: string) => void }} api
 */
export function criar(ctx, api) {
  const { ui, motor } = ctx;
  const hoje = api.dataCalculo();
  const mesHoje = hoje.slice(0, 7);
  const mudou = () => api.aoMudar();
  const ja = () => api.aoMudar(true);

  const forma = ui.segmentos({
    rotulo: 'Como você paga', variante: 'igual', valor: 'diaria',
    opcoes: [{ valor: 'diaria', texto: 'Por diária' }, { valor: 'hora', texto: 'Por hora' }],
    aoMudar: () => { mostrarForma(); ja(); },
  });
  const valorDiaria = ui.campoDinheiro({ rotulo: 'Valor da diária', dica: 'O valor combinado por dia de trabalho.', aoMudar: mudou });
  const valorHora = ui.campoDinheiro({ rotulo: 'Valor por hora', aoMudar: mudou });
  const horasDia = ui.campoNumero({ rotulo: 'Horas por dia', valor: 8, min: 0.5, max: 24, passo: 0.5, unidade: 'horas', aoMudar: mudou });
  const blocoDiaria = ui.h('div', { class: 'calc-campos' }, valorDiaria);
  const blocoHora = ui.h('div', { class: 'grade-2' }, valorHora, horasDia);

  const contagem = ui.segmentos({
    rotulo: 'Dias por semana', variante: 'igual', valor: 'marcados',
    opcoes: [{ valor: 'marcados', texto: 'Marcar os dias' }, { valor: 'media', texto: 'Só a quantidade' }],
    aoMudar: () => { mostrarForma(); ja(); },
  });
  const dias = ui.seletorDias({ rotulo: 'Dias em que ela vem', valor: [2], aoMudar: ja });
  const diasMedia = ui.campoNumero({
    rotulo: 'Dias por semana (média)', valor: 1, min: 0.5, max: 7, passo: 0.5, unidade: 'dias',
    dica: 'Use 0,5 para "a cada 15 dias".', aoMudar: mudou,
  });
  const mes = ui.campoSelecao({
    rotulo: 'Mês de referência', largo: true, opcoes: opcoesMeses(hoje), valor: mesHoje,
    dica: 'Conta quantas vezes cada dia marcado cai no mês. Feriados não são descontados.', aoMudar: ja,
  });
  const blocoMarcados = ui.h('div', { class: 'calc-campos' }, dias, mes);
  const mesmaCasa = ui.segmentos({
    rotulo: 'Sempre na mesma casa?', variante: 'igual', valor: 'sim',
    opcoes: [{ valor: 'sim', texto: 'Sim' }, { valor: 'nao', texto: 'Não, em casas diferentes' }],
    dica: 'Conta para o alerta de vínculo: mais de 2 dias por semana na mesma casa pode ser emprego doméstico.',
    aoMudar: ja,
  });

  function mostrarForma() {
    blocoDiaria.hidden = forma.valor !== 'diaria';
    blocoHora.hidden = forma.valor !== 'hora';
    blocoMarcados.hidden = contagem.valor !== 'marcados';
    diasMedia.hidden = contagem.valor !== 'media';
  }
  mostrarForma();

  const campos = ui.h('div', { class: 'calc-campos' }, forma, blocoDiaria, blocoHora, contagem, blocoMarcados, diasMedia, mesmaCasa);

  // ───── O que a diarista pode recolher (só informação) ─────
  const listaRecolhe = ui.h('div');
  const extras = ui.h('section', { class: 'bloco bloco--papel calc-recolhe', 'aria-labelledby': 'calc-recolhe-titulo' },
    ui.h('h2', { class: 'bloco-titulo', id: 'calc-recolhe-titulo' }, 'O que a diarista pode recolher'),
    ui.h('p', { class: 'bloco-sub' }, 'É pago por ela, por conta própria. Não entra no seu custo. Serve para conversar sobre o valor da diária.'),
    listaRecolhe);

  function lerEntrada() {
    const e = {};
    if (forma.valor === 'diaria') e.valorDiaria = valorDiaria.lerCentavos();
    else { e.valorHora = valorHora.lerCentavos(); e.horasDia = horasDia.lerValor(); }
    if (contagem.valor === 'marcados') { e.diasDaSemana = dias.valor; e.mes = mes.input.value; } else e.diasSemana = diasMedia.lerValor();
    e.mesmaResidencia = mesmaCasa.valor === 'sim';
    return semVazios(e);
  }

  function preencher(e = {}) {
    if (e.valorHora !== undefined && e.valorDiaria === undefined) {
      forma.definir('hora');
      valorHora.definir(e.valorHora ?? null);
      const h = numeroDe(e.horasDia);
      if (h !== null) horasDia.definir(h);
      valorDiaria.definir(null);
    } else {
      forma.definir('diaria');
      valorDiaria.definir(e.valorDiaria ?? null);
    }
    if (Array.isArray(e.diasDaSemana)) {
      contagem.definir('marcados');
      dias.definir(e.diasDaSemana);
    } else if (numeroDe(e.diasSemana) !== null) {
      contagem.definir('media');
      diasMedia.definir(numeroDe(e.diasSemana));
    }
    if (mesValido(e.mes)) { garantirOpcao(mes.input, e.mes, nomeMes(e.mes)); mes.input.value = e.mes; }
    if (e.mesmaResidencia !== undefined) mesmaCasa.definir(e.mesmaResidencia === false ? 'nao' : 'sim');
    mostrarForma();
  }

  function calcular(data) {
    const entrada = lerEntrada();
    const vazios = [];
    let faltando = null;
    if (forma.valor === 'diaria' && entrada.valorDiaria === undefined) { vazios.push('valorDiaria'); faltando = 'Preencha o valor da diária'; }
    if (forma.valor === 'hora' && (entrada.valorHora === undefined || entrada.horasDia === undefined)) {
      vazios.push('valorDiaria', 'valorHora', 'horasDia');
      faltando = entrada.valorHora === undefined ? 'Preencha o valor por hora' : 'Preencha as horas por dia';
    }
    const marcados = contagem.valor === 'marcados';
    if ((marcados && !(entrada.diasDaSemana || []).length) || (!marcados && entrada.diasSemana === undefined)) {
      vazios.push('diasSemana');
      faltando = faltando || (marcados ? 'Marque os dias em que ela vem' : 'Preencha os dias por semana');
    }
    const r = motor.calcularDiarista({ ...entrada, uf: ctx.config.uf || undefined }, data, { overrides: ctx.overrides() });
    const res = r.resultado;
    const temMesReal = res.custo_mes !== null && res.custo_mes !== undefined;
    const principal = temMesReal ? res.custo_mes : res.custo_mes_media;
    const titulo = temMesReal ? `Você paga em ${nomeMes(res.mes)}` : 'Você paga por mês (média)';
    const diasTexto = temMesReal ? `${res.dias_no_mes} ${plural(res.dias_no_mes, 'dia', 'dias')}` : `${motor.formatarNumero(res.dias_mes_media, 2)} dias (média)`;

    // contribuições da diarista (só informação)
    const c = res.contribuicoes_diarista;
    if (c) {
      ui.trocar(listaRecolhe, ui.listaResumo([
        { rotulo: 'INSS no plano simplificado (11%)', detalhe: 'sobre o salário mínimo; sem aposentadoria por tempo de contribuição', valorCentavos: c.inss_simplificado_11 },
        { rotulo: 'INSS no plano normal (20%)', detalhe: 'sobre a renda média do mês, entre o mínimo e o teto', valorCentavos: c.inss_normal_20 },
        { rotulo: 'DAS do MEI', detalhe: 'INSS + ISS (se a ocupação paga ISS não foi verificado)', valorCentavos: c.mei_das_com_iss },
      ]), ui.h('p', { class: 'calc-nota' }, ui.selo('nao_verificado'), ' O valor do MEI inclui o ISS. Veja "Mostrar a conta" para as fontes.'));
    }

    // alerta de vínculo: oferece ver o custo com registro
    const alertas = r.alertas.map((a) => (a.codigo === 'vinculo_domestico'
      ? { ...a, acoes: [{ texto: 'Ver como doméstico', aoClicar: () => api.trocarModo('domestico') }] }
      : a));

    return {
      r, faltando, vazios, alertas,
      cartao: {
        titulo, meta: temMesReal ? mesCurto(res.mes) : 'média', valorCentavos: principal, extenso: false,
        linhas: [
          { rotulo: 'Valor da diária', valorCentavos: res.valor_diaria },
          { rotulo: 'Dias no mês', texto: diasTexto },
          temMesReal ? { rotulo: 'Média por mês', detalhe: 'dias por semana × 52 semanas ÷ 12', valorCentavos: res.custo_mes_media } : null,
          { rotulo: 'Por ano (média)', valorCentavos: res.custo_ano_media },
        ].filter(Boolean),
      },
      resumo: { rotulo: titulo, valor_centavos: principal },
      compart: {
        titulo: `Diarista: ${titulo.replace('Você paga', 'custo').replace('custo em', 'custo de')}`,
        linhas: [
          { rotulo: 'Diária', valor_centavos: res.valor_diaria },
          { rotulo: 'Dias por semana', texto: motor.formatarNumero(res.dias_semana) },
          { rotulo: 'Dias no mês', texto: diasTexto },
          { rotulo: temMesReal ? `Custo em ${nomeMes(res.mes)}` : 'Custo médio por mês', valor_centavos: principal },
          temMesReal ? { rotulo: 'Média por mês', valor_centavos: res.custo_mes_media } : null,
        ].filter(Boolean),
        nota: notaVinculo(res.dias_semana, entrada.mesmaResidencia !== false, data),
      },
      anuncio: `${titulo}: ${motor.formatarBRL(principal)}`,
    };
  }

  /** Nota do texto compartilhado: com 3 dias ou mais na mesma casa, avisa do risco de vínculo (nunca "sem direitos"). */
  function notaVinculo(diasSemana, mesmaResidencia, data) {
    const p = motor.getParam('vinculo_domestico', data);
    const limite = (p && p.valor && p.valor.dias_semana_a_partir_de) || 3;
    if (mesmaResidencia && Number(diasSemana) >= limite) {
      return `Com ${limite} dias ou mais por semana na mesma casa, pode ser emprego doméstico (LC 150, art. 1º).`;
    }
    return mesmaResidencia
      ? `Diarista até ${limite - 1} dias por semana na mesma casa: sem 13º, férias nem FGTS.`
      : 'Diarista em casas diferentes: sem 13º, férias nem FGTS.';
  }

  function aplicarExemplo(entrada) { preencher(entrada); }

  return {
    id: 'diarista', campos, extras, lerEntrada, preencher, calcular, aplicarExemplo,
    idsTotal: ['custo_mes'], idsDesconto: [],
    focoInicial: () => (forma.valor === 'diaria' ? valorDiaria.input : valorHora.input),
  };
}
