// Alertas reutilizáveis: vínculo doméstico, mínimo e piso, mudança de jornada, tempo parcial.
import { getParam, listarMudancasFuturas, diasEntre, FONTES } from './parametros.js';
import { alerta, formatarDataBR, fracao } from './comum.js';
import { formatarBRL, formatarNumero } from './dinheiro.js';
import { horaMinima, pisoDomestico, obterJornada, datasJornada } from './jornada.js';

/**
 * Mais de 2 dias por semana na mesma residência => alerta de risco, com texto cauteloso.
 * mesmaResidencia: true/false/undefined (indefinido conta como "mesma casa" para avisar).
 */
export function alertasVinculoDomestico({ diasSemana, mesmaResidencia } = {}, dataISO) {
  const p = getParam('vinculo_domestico', dataISO) || { valor: { dias_semana_a_partir_de: 3 }, fonte_url: FONTES.lc150 };
  const limite = p.valor.dias_semana_a_partir_de;
  const dias = Number(diasSemana) || 0;
  // LC 150, art. 1º: "por mais de 2 dias por semana" — vale também para média fracionária (ex.: 2,5)
  if (dias > limite - 1 && mesmaResidencia !== false) {
    return [alerta('risco', 'vinculo_domestico', 'Pode ser emprego doméstico',
      `Com ${formatarNumero(dias)} dias por semana na mesma casa, este trabalho pode ser emprego doméstico, com carteira assinada, DAE, 13º e férias. A LC 150, art. 1º, considera doméstico quem trabalha de forma contínua na residência por mais de 2 dias por semana. Quem decide é a Justiça, olhando os fatos; veja o modo "Doméstico" para o custo com registro.`,
      p.fonte_url, { lei: 'LC 150, art. 1º' })];
  }
  if (dias === limite - 1 && mesmaResidencia !== false) {
    return [alerta('info', 'vinculo_limite', 'No limite da diarista',
      `${dias} dias por semana na mesma casa é o máximo antes de poder virar emprego doméstico (LC 150, art. 1º: mais de 2 dias por semana).`,
      p.fonte_url, { lei: 'LC 150, art. 1º' })];
  }
  return [];
}

/**
 * Compara um valor-hora com o mínimo-hora e, se a UF for informada, com o piso estadual por hora.
 * Devolve { alertas, hora_minima, piso_hora }.
 */
export function alertasValorHora(valorHora, dataISO, { uf = null, overrides = {}, nivel = 'atencao', grupoPR = null, semVinculo = false } = {}) {
  const alertas = [];
  const hm = horaMinima(dataISO, overrides);
  alertas.push(...hm.alertas);
  // sem vínculo de emprego (por hora simples, diarista) o mínimo não se aplica por lei: só referência
  if (semVinculo) nivel = 'info';
  const ref = semVinculo ? '. Só referência: sem vínculo de emprego, o mínimo não se aplica por lei' : '';
  let pisoHora = null;
  if (valorHora !== null && valorHora < hm.valor) {
    if (hm.derivado) {
      alertas.push(alerta(nivel, 'abaixo_minimo', semVinculo ? 'Abaixo da referência do mínimo mensal proporcional' : 'Abaixo do mínimo mensal proporcional (conta do app)',
        `${formatarBRL(valorHora)} por hora fica abaixo de ${formatarBRL(hm.valor)} por hora, o mínimo mensal dividido pelo divisor ${hm.divisor} (conta do app, não valor do decreto do mínimo)${ref}.`,
        hm.passo.fonte_url, { valor_referencia: hm.valor, derivado: true }));
    } else {
      alertas.push(alerta(nivel, 'abaixo_minimo', semVinculo ? 'Abaixo da referência do mínimo por hora' : 'Abaixo do salário mínimo por hora',
        `${formatarBRL(valorHora)} por hora fica abaixo do mínimo de ${formatarBRL(hm.valor)} por hora${ref}.`,
        hm.passo.fonte_url, { valor_referencia: hm.valor }));
    }
  }
  if (uf) {
    const piso = pisoDomestico(uf, dataISO, overrides, { grupoPR });
    alertas.push(...piso.alertas.filter((a) => a.codigo !== 'minimo_previsto'));
    if (piso.origem === 'piso_uf') {
      const j = obterJornada(dataISO, overrides.jornada_datas ? { jornada_datas: overrides.jornada_datas } : {});
      pisoHora = fracao(piso.valor, 1, j.divisor);
      if (valorHora !== null && valorHora < pisoHora && valorHora >= hm.valor) {
        alertas.push(alerta(nivel, 'abaixo_piso', `Abaixo do piso de ${piso.uf} por hora`,
          `${formatarBRL(valorHora)} por hora fica abaixo do piso do doméstico em ${piso.uf}: ${formatarBRL(piso.valor)} ÷ ${j.divisor} h = ${formatarBRL(pisoHora)} por hora${ref}.`,
          piso.param.fonte_url, { valor_referencia: pisoHora }));
      }
    }
  }
  return { alertas, hora_minima: hm.valor, piso_hora: pisoHora, passo_hora_minima: hm.passo };
}

/** Salário mensal abaixo do piso/mínimo (proporcional às horas, se tempo parcial). */
export function alertasSalarioMensal(salario, dataISO, { uf = null, overrides = {}, proporcao = 1, grupoPR = null } = {}) {
  const piso = pisoDomestico(uf, dataISO, overrides, { grupoPR });
  const alertas = [...piso.alertas];
  const exigido = Math.round(piso.valor * proporcao);
  if (salario !== null && salario < exigido) {
    const nome = piso.origem === 'piso_uf' ? `do piso de ${piso.uf}` : 'do salário mínimo';
    alertas.push(alerta('risco', piso.origem === 'piso_uf' ? 'abaixo_piso' : 'abaixo_minimo', `Salário abaixo d${piso.origem === 'piso_uf' ? 'o piso estadual' : 'o mínimo'}`,
      `${formatarBRL(salario)} fica abaixo ${nome}${proporcao < 1 ? ' proporcional às horas' : ''}: ${formatarBRL(exigido)} por mês.`,
      piso.param.fonte_url, { valor_referencia: exigido }));
  }
  return { alertas, piso };
}

/**
 * Aviso de mudança de jornada próxima (janela em dias) e, depois da troca, lembrete da liminar do STF.
 */
export function alertasMudancaJornada(dataISO, overrides = {}, janelaDias = 60, { comVinculo = true } = {}) {
  const alertas = [];
  const datas = datasJornada(overrides);
  const OFICIAL = datasJornada({});
  const divisorEm = (d) => getParam('divisor_hora', d, overrides.jornada_datas ? { jornada_datas: overrides.jornada_datas } : {})?.valor;
  for (const [marco, horas] of [['jornada_42', 42], ['jornada_40', 40]]) {
    const d = datas[marco];
    if (!d) continue;
    const faltam = diasEntre(dataISO, d);
    if (faltam > 0 && faltam <= janelaDias) {
      alertas.push(alerta('info', `mudanca_${marco}`, `Jornada cai para ${horas} h em ${formatarDataBR(d)}`,
        `Faltam ${faltam} dias. A partir de ${formatarDataBR(d)}, a jornada máxima passa a ${horas} h por semana${horas === 42 ? ', com 2 dias de repouso semanal remunerado' : ''}, e o divisor do salário-hora muda para ${divisorEm(d)} (EC 141/2026, arts. 6º e 10; Decreto 13.173/2026, art. 5º).${comVinculo ? ' O salário mensal não pode ser reduzido.' : ' Para quem presta serviço sem vínculo, isso muda o mínimo por hora usado como referência, não o valor combinado.'}${d === OFICIAL[marco] && marco === 'jornada_42' ? ' Há quem conte a data a partir de 17/12/2026; você pode mudar a data nas configurações.' : ''}`,
        FONTES.ec141, { data_mudanca: d }));
    }
  }
  if (datas.jornada_42 && dataISO >= datas.jornada_42 && (!datas.jornada_40 || dataISO < datas.jornada_40)) {
    alertas.push(alerta('info', 'jornada_42_liminar', 'Jornada de 42 h: liminar do STF pendente de referendo',
      `A data de ${formatarDataBR(datas.jornada_42)} segue a liminar parcial do STF nas ADIs 8041 e 8042, ainda pendente de referendo do Plenário. Sem acordo ou convenção, a jornada pode ter até 8h24 por dia em 5 dias, e os 24 minutos não são pagos como extra até 15/12/2027.`,
      FONTES.stfLiminar));
  }
  return alertas;
}

/** Doméstico em tempo parcial (≤ 25 h): dias de férias por faixa. */
export function alertasTempoParcialDomestico(horasSemana, dataISO) {
  const p = getParam('tempo_parcial_domestico', dataISO);
  if (!p || !(horasSemana > 0) || horasSemana > p.valor.limite_horas_semana) return { alertas: [], dias_ferias: null };
  const faixa = p.valor.ferias_por_faixa.find((f) => horasSemana <= f.ate_horas);
  return {
    dias_ferias: faixa.dias,
    alertas: [alerta('info', 'tempo_parcial', 'Tempo parcial (até 25 h por semana)',
      `Com ${horasSemana} h por semana, o contrato é de tempo parcial: salário proporcional, no máximo 1 hora extra por dia e férias de ${faixa.dias} dias (LC 150, art. 3º).`,
      p.fonte_url, { dias_ferias: faixa.dias })],
  };
}

/** Mudanças de parâmetros nos próximos N dias (para um aviso geral). */
export function alertasMudancasProximas(dataISO, janelaDias = 60) {
  const [a, m, d] = dataISO.split('-').map(Number);
  const limite = new Date(Date.UTC(a, m - 1, d + janelaDias)).toISOString().slice(0, 10);
  return listarMudancasFuturas(dataISO, limite).map((x) => alerta('info', `mudanca_${x.chave}`,
    `${x.rotulo}: muda em ${formatarDataBR(x.vigente_desde)}${x.status !== 'vigente' ? ` (${x.status === 'previsto' ? 'previsto' : 'não verificado'})` : ''}`,
    x.observacao || '', x.fonte_url, { status: x.status }));
}
