// Jornada, divisor, salário mínimo e pisos por data. Funções auxiliares usadas pelos modos.
import { getParam, getParamComReserva, valorParam, listarVigencias, FONTES } from './parametros.js';
import { alerta, passo, fracao, formatarDataBR } from './comum.js';
import { formatarBRL } from './dinheiro.js';

/**
 * Jornada semanal, divisor e dias de repouso na data.
 * overrides.divisor_hora: aceita só divisor MENOR que o legal (mais favorável ao empregado).
 * overrides.jornada_semanal: troca a jornada (ex.: manter 44 h até acordo), marcada como editada.
 */
export function obterJornada(dataISO, overrides = {}) {
  const alertas = [];
  const ov = { ...overrides };
  let divisorPedido = null;
  if (Object.prototype.hasOwnProperty.call(ov, 'divisor_hora')) {
    divisorPedido = Number(ov.divisor_hora);
    delete ov.divisor_hora;
  }
  const pJornada = getParam('jornada_semanal', dataISO, ov);
  const pDivisor = getParam('divisor_hora', dataISO, ov);
  const pRepouso = getParam('repouso_semanal_dias', dataISO, ov);
  let divisor = pDivisor.valor;
  let divisorParam = pDivisor;
  if (divisorPedido !== null) {
    if (Number.isFinite(divisorPedido) && divisorPedido > 0 && divisorPedido < pDivisor.valor) {
      divisor = divisorPedido;
      divisorParam = { ...pDivisor, valor: divisorPedido, editado_por_usuario: true };
      alertas.push(alerta('info', 'divisor_editado', `Divisor ${divisorPedido} (contrato ou convenção)`,
        `Você usou um divisor menor que o legal (${pDivisor.valor}). Prevalece sempre o divisor mais favorável ao empregado (Decreto 13.173/2026, art. 5º, parágrafo único).`,
        FONTES.decreto13173));
    } else if (Number.isFinite(divisorPedido) && divisorPedido !== pDivisor.valor) {
      alertas.push(alerta('atencao', 'divisor_maior_ignorado', 'Divisor maior que o legal não foi usado',
        `O divisor ${divisorPedido} é menos favorável ao empregado que o legal (${pDivisor.valor}) e foi ignorado. Prevalece o divisor mais favorável (Decreto 13.173/2026, art. 5º, parágrafo único).`,
        FONTES.decreto13173));
    }
  }
  if (pJornada.editado_por_usuario || pJornada.data_editada_por_usuario) {
    alertas.push(alerta('info', 'jornada_editada', 'Jornada ou data da mudança editada por você',
      'O cálculo usa a jornada ou a data que você escolheu, não o padrão legal.', FONTES.ec141));
  }
  return {
    jornada: pJornada.valor,
    divisor,
    repouso: pRepouso.valor,
    // horas mensais por hora semanal (220/44 = 210/42 = 200/40 = 5). Inclui o repouso remunerado.
    fatorMensal: pDivisor.valor / pJornada.valor,
    params: { jornada: pJornada, divisor: divisorParam, repouso: pRepouso },
    alertas,
  };
}

/** Salário mínimo vigente na data e o previsto (se houver), sem usar o previsto no cálculo. */
export function obterMinimo(dataISO, overrides = {}) {
  const p = getParamComReserva('salario_minimo', dataISO, overrides);
  const previsto = getParam('salario_minimo', dataISO, {}, { incluirPrevistos: true });
  const alertas = [];
  if (p.fora_da_vigencia) alertas.push(alertaForaDaVigencia(p, dataISO));
  if (previsto && previsto.status === 'previsto') {
    alertas.push(alerta('info', 'minimo_previsto', `Mínimo previsto: ${formatarBRL(previsto.valor.mensal)}`,
      `Há valor previsto (${previsto.lei}), ainda não oficial. O cálculo usa o último valor oficial, ${formatarBRL(p.valor.mensal)}.`,
      previsto.fonte_url));
  }
  return { param: p, mensal: p.valor.mensal, diario: p.valor.diario, alertas };
}

/**
 * Valor-hora do mínimo na data. Com divisor 220 usa o valor do decreto (R$ 7,37);
 * com outro divisor legal (EC 141) é derivado: mensal ÷ divisor da data.
 */
export function horaMinima(dataISO, overrides = {}) {
  const min = obterMinimo(dataISO, overrides);
  const pDiv = getParam('divisor_hora', dataISO, overrides.jornada_datas ? { jornada_datas: overrides.jornada_datas } : {});
  const alertas = [...min.alertas];
  let valor;
  let formula;
  let derivado = false;
  if (pDiv.valor === 220 && min.param.valor.horario) {
    valor = min.param.valor.horario;
    formula = `Mínimo-hora do decreto: ${formatarBRL(valor)}`;
  } else {
    valor = fracao(min.mensal, 1, pDiv.valor);
    const doDecreto = min.param.valor.horario;
    formula = `Conta do app: ${formatarBRL(min.mensal)} ÷ ${pDiv.valor} h (divisor do salário-hora) = ${formatarBRL(valor)}, o mínimo mensal proporcional por hora${doDecreto ? `. O decreto do mínimo ainda fixa ${formatarBRL(doDecreto)} por hora` : ''}`;
    derivado = true;
    alertas.push(alerta('info', 'minimo_hora_derivado', 'Mínimo por hora: conta do app',
      `Conta do app: ${formatarBRL(min.mensal)} ÷ ${pDiv.valor} (divisor do salário-hora do Decreto 13.173/2026, art. 5º) = ${formatarBRL(valor)}. O Decreto 13.173 trata só do divisor, não do mínimo por hora.${doDecreto ? ` O decreto do mínimo (Decreto 12.797/2025) ainda fixa ${formatarBRL(doDecreto)} por hora.` : ''}`,
      FONTES.decreto13173, { valor_decreto_minimo: doDecreto || null, fonte_decreto_minimo: min.param.fonte_url }));
  }
  return {
    valor,
    derivado,
    divisor: pDiv.valor,
    passo: passo('hora_minima', derivado ? 'Mínimo mensal proporcional por hora (conta do app)' : 'Salário mínimo por hora', formula, valor, derivado ? pDiv : min.param),
    alertas,
  };
}

/**
 * Piso do doméstico na UF e data, comparado com o mínimo: devolve o MAIOR (pergunta 12a).
 * grupoPR: 'I' | 'II' | 'III' | 'IV' (padrão II).
 */
export function pisoDomestico(uf, dataISO, overrides = {}, { grupoPR = null } = {}) {
  const min = obterMinimo(dataISO, overrides);
  const alertas = [...min.alertas];
  const resultado = {
    uf: uf || null,
    valor: min.mensal,
    origem: 'minimo',
    piso_estadual: null,
    param: min.param,
    alertas,
  };
  if (!uf) return resultado;
  const UF = String(uf).toUpperCase();
  resultado.uf = UF;
  const chave = `piso_domestico_${UF}`;
  const existe = listarVigencias(chave).length > 0;
  if (!existe) return resultado; // demais UFs: mínimo nacional

  const p = getParam(chave, dataISO, overrides);
  if (!p) {
    const qualquer = getParam(chave, dataISO, {}, { incluirNaoVerificados: true });
    if (qualquer && qualquer.status === 'nao_verificado') {
      alertas.push(alerta('info', 'piso_nao_verificado', `Piso de ${UF} não verificado`,
        `O piso estadual informado para ${UF} (${formatarBRL(qualquer.valor)}, ${qualquer.lei}) não foi verificado em fonte primária e não entra no cálculo. Usei o mínimo nacional.`,
        qualquer.fonte_url, { status: 'nao_verificado' }));
    } else {
      const vig = listarVigencias(chave);
      const ultima = vig[vig.length - 1];
      alertas.push(alerta('atencao', 'piso_sem_vigencia', `Piso de ${UF} sem valor conferido para esta data`,
        `Não há piso estadual conferido para ${formatarDataBR(dataISO)} (o último conferido vale de ${formatarDataBR(ultima.vigente_desde)}${ultima.vigente_ate ? ' a ' + formatarDataBR(ultima.vigente_ate) : ''}). Usei o mínimo nacional; o piso real pode ser maior.`,
        ultima.fonte_url));
    }
    return resultado;
  }
  let valorPiso = p.valor;
  if (UF === 'PR' && p.grupos) {
    const g = grupoPR && p.grupos[grupoPR] ? grupoPR : p.grupo_padrao;
    valorPiso = p.grupos[g];
    resultado.grupo = g;
    alertas.push(alerta('info', 'piso_pr_grupo', `Paraná: Grupo ${g}`,
      'Enquadramento do doméstico no Grupo II deduzido pela CBO (GG 5); convenção coletiva da categoria prevalece.', p.fonte_url));
  }
  resultado.piso_estadual = valorPiso;
  resultado.param = p;
  if (valorPiso >= min.mensal) {
    resultado.valor = valorPiso;
    resultado.origem = 'piso_uf';
  }
  alertas.push(alerta('info', 'piso_convencao', 'Convenção coletiva prevalece',
    'O piso estadual não vale onde houver piso de convenção ou acordo coletivo da categoria.', p.fonte_url));
  return resultado;
}

/** Datas da mudança de jornada (com overrides de data). */
export function datasJornada(overrides = {}) {
  const v = listarVigencias('jornada_semanal', overrides);
  const d42 = v.find((x) => x.marco === 'jornada_42');
  const d40 = v.find((x) => x.marco === 'jornada_40');
  return { jornada_42: d42 ? d42.vigente_desde : null, jornada_40: d40 ? d40.vigente_desde : null };
}

/** Alerta padrão quando a data pede uma tabela que o app não tem (ex.: antes de 2026). */
export function alertaForaDaVigencia(p, dataISO) {
  return alerta('atencao', 'fora_da_vigencia', `${p.rotulo}: sem tabela para ${formatarDataBR(dataISO)}`,
    `O app não tem o valor oficial para essa data. Usei o valor que vale desde ${formatarDataBR(p.vigente_desde)}; o resultado pode estar diferente do real.`,
    p.fonte_url);
}

export { valorParam };
