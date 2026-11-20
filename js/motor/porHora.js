// Modo "por hora simples": valor/hora × horas/dia × dias, e o modo inverso (do orçamento para as horas).
import { montar, passo, alerta, resolverData, lerDinheiroCampo, lerNumeroCampo, multiplicar, fracao, normalizarEntrada } from './comum.js';
import { formatarBRL, formatarNumero, arredondarPara } from './dinheiro.js';
import { alertasValorHora, alertasMudancaJornada } from './alertas.js';

const SEMANAS_POR_MES = 52 / 12;

/**
 * calcularPorHora({ valorHora, horasDia, dias } | { valorHora, horasDia, diasSemana, semanas? }, dataISO, opcoes)
 * opcoes: { overrides, uf, arredondamento (centavos, ex. 50) }
 * Resultado em centavos: valor_dia, total; e horas_mes (número).
 */
export function calcularPorHora(entrada = {}, dataISO, opcoes = {}) {
  entrada = normalizarEntrada(entrada);
  opcoes = opcoes || {};
  const alertas = [];
  const passos = [];
  const data = resolverData(dataISO, alertas);
  const overrides = opcoes.overrides || {};
  const uf = entrada.uf || opcoes.uf || null;

  const valorHora = lerDinheiroCampo(entrada, 'valorHora', 'o valor por hora', alertas, { obrigatorio: true });
  const horasDia = lerNumeroCampo(entrada, 'horasDia', 'as horas por dia', alertas, { obrigatorio: true, min: 0, max: 24 });
  let dias = lerNumeroCampo(entrada, 'dias', 'os dias', alertas, { min: 0, max: 366 });
  let origemDias = 'informado';
  let diasSemana = null;
  if (dias === null) {
    diasSemana = lerNumeroCampo(entrada, 'diasSemana', 'os dias por semana', alertas, { min: 0, max: 7 });
    let semanas = lerNumeroCampo(entrada, 'semanas', 'as semanas', alertas, { min: 0, max: 53 });
    if (diasSemana !== null) {
      if (semanas === null) { semanas = SEMANAS_POR_MES; origemDias = 'media'; } else origemDias = 'semanas';
      dias = diasSemana * semanas;
      passos.push(passo('dias', 'Dias no período',
        `${formatarNumero(diasSemana)} dias/semana × ${origemDias === 'media' ? '52 ÷ 12 semanas (média do mês)' : formatarNumero(semanas) + ' semanas'} = ${formatarNumero(dias, 2)} dias`,
        null, null, { unidade: 'dias' }));
    } else {
      alertas.push(alerta('atencao', 'entrada_invalida', 'Falta o número de dias', 'Informe os dias do período ou os dias por semana.', null, { campo: 'dias' }));
    }
  }

  const resultado = { valor_hora: valorHora || 0, valor_dia: 0, horas_mes: 0, dias: dias || 0, total: 0 };
  if (valorHora !== null && horasDia !== null) {
    resultado.valor_dia = multiplicar(valorHora, horasDia);
    passos.push(passo('valor_dia', 'Valor por dia', `${formatarBRL(valorHora)} × ${formatarNumero(horasDia)} h = ${formatarBRL(resultado.valor_dia)}`, resultado.valor_dia));
  }
  if (valorHora !== null && horasDia !== null && dias !== null) {
    resultado.horas_mes = Math.round(horasDia * dias * 100) / 100;
    // com a média de semanas: valor × horas/semana × 52 ÷ 12 numa só divisão em BigInt,
    // arredondando uma vez só no fim (sem arredondar o total da semana antes)
    const total = origemDias === 'media'
      ? fracao(valorHora, Math.round(horasDia * diasSemana * 1000000) * 52, 12 * 1000000)
      : multiplicar(valorHora, horasDia * dias);
    resultado.total = arredondarPara(total, opcoes.arredondamento);
    passos.push(passo('horas', 'Horas no período', `${formatarNumero(horasDia)} h × ${formatarNumero(dias, 2)} dias = ${formatarNumero(resultado.horas_mes, 2)} h`, null, null, { unidade: 'horas' }));
    passos.push(passo('total', 'Total', `${formatarBRL(valorHora)} × ${formatarNumero(resultado.horas_mes, 2)} h = ${formatarBRL(total)}${opcoes.arredondamento ? ` (arredondado para ${formatarBRL(resultado.total)})` : ''}`, resultado.total));
  }

  if (valorHora !== null) {
    const av = alertasValorHora(valorHora, data, { uf, overrides, semVinculo: true });
    resultado.hora_minima = av.hora_minima;
    if (av.piso_hora) resultado.piso_hora = av.piso_hora;
    alertas.push(...av.alertas);
    passos.push(av.passo_hora_minima);
  }
  if (horasDia !== null && horasDia > 8) {
    alertas.push(alerta('info', 'acima_8h', 'Mais de 8 horas por dia',
      'Para empregados, a jornada normal é de até 8 h por dia; o que passar é hora extra (pelo menos 50% a mais).', null));
  }
  alertas.push(...alertasMudancaJornada(data, overrides));
  return montar({ entrada, resultado, passos, alertas, data });
}

/**
 * Modo inverso: dado um orçamento, quantas horas cabem.
 * calcularPorHoraInverso({ orcamento, valorHora, dias?, horasDia? }, dataISO)
 * resultado: horas (total que cabe), horas_por_dia (se dias), dias_inteiros (se horasDia), sobra (centavos).
 */
export function calcularPorHoraInverso(entrada = {}, dataISO, opcoes = {}) {
  entrada = normalizarEntrada(entrada);
  opcoes = opcoes || {};
  const alertas = [];
  const passos = [];
  const data = resolverData(dataISO, alertas);
  const orcamento = lerDinheiroCampo(entrada, 'orcamento', 'o orçamento', alertas, { obrigatorio: true });
  const valorHora = lerDinheiroCampo(entrada, 'valorHora', 'o valor por hora', alertas, { obrigatorio: true });
  const dias = lerNumeroCampo(entrada, 'dias', 'os dias', alertas, { min: 0, max: 366 });
  const horasDia = lerNumeroCampo(entrada, 'horasDia', 'as horas por dia', alertas, { min: 0, max: 24 });
  const resultado = { horas: 0, horas_por_dia: null, dias_inteiros: null, sobra: 0 };
  if (orcamento !== null && valorHora) {
    // horas com 2 casas, sempre para baixo (não passar do orçamento)
    const centesimos = Math.floor((orcamento * 100) / valorHora);
    resultado.horas = centesimos / 100;
    passos.push(passo('horas', 'Horas que cabem', `${formatarBRL(orcamento)} ÷ ${formatarBRL(valorHora)} = ${formatarNumero(resultado.horas, 2)} h`, null, null, { unidade: 'horas' }));
    if (dias) {
      resultado.horas_por_dia = Math.floor((resultado.horas / dias) * 100) / 100;
      passos.push(passo('horas_por_dia', 'Horas por dia', `${formatarNumero(resultado.horas, 2)} h ÷ ${formatarNumero(dias)} dias = ${formatarNumero(resultado.horas_por_dia, 2)} h por dia`, null, null, { unidade: 'horas' }));
    }
    if (horasDia) {
      const valorDia = multiplicar(valorHora, horasDia);
      resultado.dias_inteiros = valorDia > 0 ? Math.floor(orcamento / valorDia) : 0;
      resultado.sobra = orcamento - resultado.dias_inteiros * valorDia;
      passos.push(passo('dias', 'Dias inteiros', `${formatarBRL(orcamento)} ÷ (${formatarBRL(valorHora)} × ${formatarNumero(horasDia)} h = ${formatarBRL(valorDia)}) = ${resultado.dias_inteiros} dias; sobra ${formatarBRL(resultado.sobra)}`, resultado.sobra));
    } else {
      resultado.sobra = orcamento - multiplicar(valorHora, resultado.horas);
    }
  } else if (valorHora === 0) {
    alertas.push(alerta('atencao', 'entrada_invalida', 'Valor por hora zero', 'O valor por hora precisa ser maior que zero.', null, { campo: 'valorHora' }));
  }
  if (valorHora) {
    const av = alertasValorHora(valorHora, data, { uf: entrada.uf || opcoes.uf || null, overrides: opcoes.overrides || {}, semVinculo: true });
    alertas.push(...av.alertas);
  }
  return montar({ entrada, resultado, passos, alertas, data });
}
