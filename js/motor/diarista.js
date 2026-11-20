// Modo diarista sem vínculo (até 2 dias por semana na mesma casa).
import { getParamComReserva, getParam, FONTES, dataValida } from './parametros.js';
import { montar, passo, alerta, resolverData, lerDinheiroCampo, lerNumeroCampo, multiplicar, fracao, normalizarEntrada } from './comum.js';
import { formatarBRL, formatarNumero, aplicarPct } from './dinheiro.js';
import { alertasVinculoDomestico, alertasValorHora } from './alertas.js';
import { obterMinimo } from './jornada.js';

export const NOMES_DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Quantas vezes cada dia da semana (0 = domingo … 6 = sábado) aparece no mês 'AAAA-MM'. */
export function contarDiasDaSemanaNoMes(mesISO, diasDaSemana) {
  const [a, m] = mesISO.split('-').map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const conjunto = new Set(diasDaSemana);
  const porDia = {};
  for (const d of conjunto) porDia[d] = 0;
  let total = 0;
  for (let dia = 1; dia <= ultimo; dia++) {
    const dw = new Date(Date.UTC(a, m - 1, dia)).getUTCDay();
    if (conjunto.has(dw)) { porDia[dw] += 1; total += 1; }
  }
  return { total, porDia, diasNoMes: ultimo };
}

/**
 * calcularDiarista(entrada, dataISO, opcoes)
 * entrada: {
 *   valorDiaria | (valorHora + horasDia),
 *   diasDaSemana: [2, 4] (0 = domingo) — ou diasSemana: 2,
 *   mesmaResidencia: true | false,
 *   mes: 'AAAA-MM' (padrão: mês da data de referência),
 *   uf?: 'SP' (piso por hora, só referência)
 * }
 */
export function calcularDiarista(entrada = {}, dataISO, opcoes = {}) {
  entrada = normalizarEntrada(entrada);
  opcoes = opcoes || {};
  const alertas = [];
  const passos = [];
  const data = resolverData(dataISO, alertas);
  const overrides = opcoes.overrides || {};

  // valor da diária
  let valorDiaria = lerDinheiroCampo(entrada, 'valorDiaria', 'o valor da diária', alertas);
  let valorHora = lerDinheiroCampo(entrada, 'valorHora', 'o valor por hora', alertas);
  const horasDia = lerNumeroCampo(entrada, 'horasDia', 'as horas por dia', alertas, { min: 0, max: 24 });
  if (valorDiaria === null && valorHora !== null && horasDia !== null) {
    valorDiaria = multiplicar(valorHora, horasDia);
    passos.push(passo('diaria', 'Valor da diária', `${formatarBRL(valorHora)} × ${formatarNumero(horasDia)} h = ${formatarBRL(valorDiaria)}`, valorDiaria));
  } else if (valorDiaria !== null) {
    if (valorHora === null && horasDia) valorHora = Math.floor(valorDiaria / horasDia);
    passos.push(passo('diaria', 'Valor da diária', `Diária combinada = ${formatarBRL(valorDiaria)}`, valorDiaria));
  } else {
    alertas.push(alerta('atencao', 'entrada_invalida', 'Falta o valor', 'Informe o valor da diária ou o valor por hora e as horas por dia.', null, { campo: 'valorDiaria' }));
  }

  // dias por semana
  let diasDaSemana = Array.isArray(entrada.diasDaSemana)
    ? [...new Set(entrada.diasDaSemana.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))]
    : null;
  let diasSemana = diasDaSemana ? diasDaSemana.length : lerNumeroCampo(entrada, 'diasSemana', 'os dias por semana', alertas, { min: 0, max: 7 });
  if (diasSemana === null) {
    alertas.push(alertas.some((a) => a.campo === 'diasSemana') ? null : alerta('atencao', 'entrada_invalida', 'Faltam os dias por semana', 'Marque os dias da semana ou informe quantos dias por semana.', null, { campo: 'diasSemana' }));
    diasSemana = 0;
  }
  let mes = data.slice(0, 7);
  if (entrada.mes !== undefined && entrada.mes !== null && entrada.mes !== '') {
    if (typeof entrada.mes === 'string' && /^\d{4}-\d{2}$/.test(entrada.mes) && dataValida(`${entrada.mes}-01`)) {
      mes = entrada.mes;
    } else {
      alertas.push(alerta('atencao', 'entrada_invalida', 'Mês inválido',
        `O mês "${String(entrada.mes)}" não existe (use AAAA-MM, com mês de 01 a 12). Usei ${mes.slice(5)}/${mes.slice(0, 4)}, o mês da data de referência.`, null, { campo: 'mes' }));
    }
  }

  const resultado = {
    valor_diaria: valorDiaria || 0,
    dias_semana: diasSemana,
    mes,
    dias_no_mes: null,
    custo_mes: null,
    custo_mes_media: 0,
    dias_mes_media: Math.round(diasSemana * 52 / 12 * 100) / 100,
    custo_ano_media: 0,
    tem_13: false,
    tem_ferias: false,
    tem_dsr: false,
    contribuicoes_diarista: null,
  };

  if (valorDiaria !== null) {
    // média: dias/semana × 52 semanas ÷ 12 meses
    // dias/semana pode ser fracionário (média, ex.: 0,5 = a cada 15 dias): conta exata em BigInt
    resultado.custo_mes_media = fracao(valorDiaria, Math.round(diasSemana * 52 * 1000000), 12 * 1000000);
    resultado.custo_ano_media = multiplicar(valorDiaria, diasSemana * 52);
    passos.push(passo('custo_media', 'Custo médio por mês',
      `${formatarBRL(valorDiaria)} × ${formatarNumero(diasSemana)} dias/semana × 52 semanas ÷ 12 meses = ${formatarBRL(resultado.custo_mes_media)}`,
      resultado.custo_mes_media));
    if (diasDaSemana && diasDaSemana.length) {
      const c = contarDiasDaSemanaNoMes(mes, diasDaSemana);
      resultado.dias_no_mes = c.total;
      resultado.dias_por_dia_da_semana = Object.fromEntries(Object.entries(c.porDia).map(([k, v]) => [NOMES_DIAS[k], v]));
      resultado.custo_mes = valorDiaria * c.total;
      const lista = Object.entries(c.porDia).map(([k, v]) => `${v} ${NOMES_DIAS[k]}${v === 1 ? '' : 's'}`).join(' + ');
      passos.push(passo('custo_mes', `Custo em ${mes.slice(5)}/${mes.slice(0, 4)}`,
        `${lista} = ${c.total} dias × ${formatarBRL(valorDiaria)} = ${formatarBRL(resultado.custo_mes)} (feriados não descontados)`,
        resultado.custo_mes));
    }
    passos.push(passo('custo_ano', 'Custo por ano (média)', `${formatarBRL(valorDiaria)} × ${formatarNumero(diasSemana)} × 52 semanas = ${formatarBRL(resultado.custo_ano_media)}`, resultado.custo_ano_media));
  }

  // sem 13º, férias, DSR, FGTS e VT: explicação
  const pVinc = getParam('vinculo_domestico', data);
  passos.push(passo('sem_direitos_clt', 'Sem 13º, férias, DSR, FGTS e vale-transporte',
    'A LC 150, art. 1º, só considera empregado doméstico quem trabalha na mesma residência por mais de 2 dias por semana. Até 2 dias, a diarista fica fora da LC 150 e, por essa lei, não há 13º, férias, DSR, FGTS nem vale-transporte: paga-se a diária combinada.',
    0, pVinc || { fonte_url: FONTES.lc150, lei: 'LC 150, art. 1º' }));

  // o que a diarista pode recolher (só informação)
  const pAut = getParamComReserva('autonomo', data, overrides);
  const pMei = getParamComReserva('mei_das', data, overrides);
  const minimo = obterMinimo(data, overrides);
  const simplificado = aplicarPct(pAut.valor.base_minima, pAut.valor.simplificado_pct);
  const baseNormal = Math.min(Math.max(resultado.custo_mes_media, pAut.valor.base_minima), pAut.valor.base_maxima);
  const normal = aplicarPct(baseNormal, pAut.valor.normal_pct);
  resultado.contribuicoes_diarista = {
    inss_simplificado_11: simplificado,
    inss_normal_20: normal,
    mei_das_inss: pMei.valor.inss,
    mei_das_com_iss: pMei.valor.inss + pMei.valor.iss,
  };
  passos.push(passo('info_inss_11', 'Só informação: INSS da diarista no plano simplificado',
    `11% × ${formatarBRL(pAut.valor.base_minima)} (salário mínimo) = ${formatarBRL(simplificado)} por mês, recolhido por ela até o dia 15 (sem aposentadoria por tempo de contribuição)`,
    simplificado, pAut));
  passos.push(passo('info_inss_20', 'Só informação: INSS da diarista no plano normal',
    `20% × ${formatarBRL(baseNormal)} (renda média, entre o mínimo e o teto) = ${formatarBRL(normal)} por mês`,
    normal, pAut));
  passos.push(passo('info_mei', 'Só informação: DAS do MEI (Diarista Independente)',
    `INSS ${formatarBRL(pMei.valor.inss)} + ISS ${formatarBRL(pMei.valor.iss)} = ${formatarBRL(pMei.valor.inss + pMei.valor.iss)} por mês. Se a ocupação recolhe ISS ou ICMS não foi verificado.`,
    pMei.valor.inss + pMei.valor.iss, pMei, { status: 'nao_verificado' }));
  alertas.push(alerta('info', 'mei_nao_afasta_vinculo', 'Ser MEI não afasta o vínculo',
    'Mesmo com MEI, trabalhar mais de 2 dias por semana na mesma casa, com subordinação, pode caracterizar emprego doméstico (LC 150, art. 1º).',
    FONTES.meiDiarista));

  // vínculo
  alertas.push(...alertasVinculoDomestico({ diasSemana, mesmaResidencia: entrada.mesmaResidencia }, data));

  // mínimo (referência)
  if (valorHora !== null && (horasDia || entrada.valorHora !== undefined)) {
    alertas.push(...alertasValorHora(valorHora, data, { uf: entrada.uf || null, overrides, semVinculo: true }).alertas);
  } else if (valorDiaria !== null && valorDiaria < minimo.diario) {
    alertas.push(alerta('info', 'abaixo_minimo', 'Diária abaixo da referência do mínimo por dia',
      `${formatarBRL(valorDiaria)} fica abaixo do salário mínimo por dia (${formatarBRL(minimo.diario)}), usado aqui como referência.`,
      minimo.param.fonte_url));
  }
  alertas.push(...minimo.alertas);

  return montar({ entrada, resultado, passos, alertas: alertas.filter(Boolean), data });
}
