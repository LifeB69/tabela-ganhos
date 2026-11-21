// Modo doméstico (mensalista ou horista): salário, descontos, DAE, custo do empregador e provisões.
import { getParam, getParamComReserva, FONTES } from './parametros.js';
import { montar, passo, alerta, resolverData, lerDinheiroCampo, lerNumeroCampo, multiplicar, fracao, formatarDataBR, normalizarEntrada } from './comum.js';
import { formatarBRL, formatarNumero, formatarPct, aplicarPct } from './dinheiro.js';
import { inssProgressivo, passosInss } from './inss.js';
import { irrfMensal, passosIrrf } from './irrf.js';
import { obterJornada, alertaForaDaVigencia } from './jornada.js';
import { alertasSalarioMensal, alertasMudancaJornada, alertasTempoParcialDomestico } from './alertas.js';

// ───────────── Vencimento do DAE ─────────────
function pascoa(ano) {
  // algoritmo de Meeus/Jones/Butcher (calendário gregoriano)
  const a = ano % 19; const b = Math.floor(ano / 100); const c = ano % 100;
  const d = Math.floor(b / 4); const e = b % 4; const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

const FERIADOS_FIXOS = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];

/** Dia útil bancário aproximado: não é sábado, domingo, feriado nacional fixo nem Sexta-feira Santa. */
export function ehDiaUtil(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  const dw = dt.getUTCDay();
  if (dw === 0 || dw === 6) return false;
  if (FERIADOS_FIXOS.includes(iso.slice(5))) return false;
  const sextaSanta = new Date(pascoa(a).getTime() - 2 * 86400000).toISOString().slice(0, 10);
  return iso !== sextaSanta;
}

/**
 * Vencimento do DAE da competência (mês de dataISO): dia 20 do mês seguinte, antecipado para o
 * dia útil anterior. Considera fins de semana, feriados nacionais fixos e Sexta-feira Santa;
 * feriados locais e pontos facultativos não entram.
 */
export function vencimentoDae(dataISO) {
  const p = getParamComReserva('dae_vencimento', dataISO);
  const [a, m] = dataISO.split('-').map(Number);
  let dt = new Date(Date.UTC(a, m, p.valor.dia)); // m (0-based) = mês seguinte
  let iso = dt.toISOString().slice(0, 10);
  while (!ehDiaUtil(iso)) {
    dt = new Date(dt.getTime() - 86400000);
    iso = dt.toISOString().slice(0, 10);
  }
  return { vencimento: iso, param: p };
}

// ───────────── Encargos do empregador ─────────────
/**
 * Encargos do empregador doméstico sobre uma remuneração (centavos).
 * CPP (8%) e GILRAT (0,8%) incidem sobre o salário de contribuição, limitado ao teto do INSS
 * (Lei 8.212, art. 24, caput, e art. 28, II e §5º). FGTS (8%) e indenização (3,2%) incidem
 * sobre a remuneração inteira (LC 150, arts. 22 e 34).
 */
export function encargosDomestico(remuneracao, teto, e) {
  const base_inss = Math.min(remuneracao, teto);
  const cpp = aplicarPct(base_inss, e.cpp_pct);
  const gilrat = aplicarPct(base_inss, e.gilrat_pct);
  const fgts = aplicarPct(remuneracao, e.fgts_pct);
  const indenizacao = aplicarPct(remuneracao, e.indenizacao_pct);
  return { cpp, gilrat, fgts, indenizacao, total: cpp + gilrat + fgts + indenizacao, base_inss, limitado: remuneracao > teto };
}

// ───────────── Cálculo principal ─────────────
/**
 * calcularDomestico(entrada, dataISO, opcoes)
 * entrada: {
 *   tipo: 'mensalista' | 'horista' (padrão mensalista),
 *   salario (mensalista)  |  valorHora + horasSemana (horista),
 *   horasSemana? (mensalista: jornada contratual; abaixo de 25 h = tempo parcial),
 *   uf?, grupoPR?, dependentes?, filhosSalarioFamilia?,
 *   custoVtMes? (custo das passagens no mês), recusaVt?, diasComVale?, diasUteisMes?,
 *   horasExtras? (50%), horasDomingoFeriado? (não compensadas), pagarDobroDomingoFeriado? (padrão true),
 *   horasNoturnas? (horas de relógio entre 22h e 5h no mês)
 * }
 * opcoes: { overrides } — ex.: { divisor_hora: 200 } (só se menor), { jornada_datas: { jornada_42: '2026-12-17' } }
 */
export function calcularDomestico(entrada = {}, dataISO, opcoes = {}) {
  entrada = normalizarEntrada(entrada);
  opcoes = opcoes || {};
  const alertas = [];
  const passos = [];
  const data = resolverData(dataISO, alertas);
  const overrides = opcoes.overrides || {};
  const tipo = entrada.tipo === 'horista' ? 'horista' : 'mensalista';

  const j = obterJornada(data, overrides);
  alertas.push(...j.alertas);

  const horasSemana = lerNumeroCampo(entrada, 'horasSemana', 'as horas por semana', alertas, { obrigatorio: tipo === 'horista', min: 1, max: 168 });
  let salario = null;
  let valorHoraBase = null; // horista: valor/hora combinado
  let divisorUsado = j.divisor;

  if (tipo === 'mensalista') {
    salario = lerDinheiroCampo(entrada, 'salario', 'o salário mensal', alertas, { obrigatorio: true });
    if (salario !== null) {
      passos.push(passo('salario', 'Salário mensal', `Salário combinado = ${formatarBRL(salario)}`, salario));
    }
    if (horasSemana && horasSemana < j.jornada) {
      const divContrato = Math.round(horasSemana * j.fatorMensal * 100) / 100;
      if (divContrato < divisorUsado) {
        divisorUsado = divContrato;
        passos.push(passo('divisor', 'Divisor do salário-hora (jornada contratual menor)',
          `${formatarNumero(horasSemana)} h/semana × ${formatarNumero(j.fatorMensal)} (= ${j.params.divisor.valor} ÷ ${j.jornada}) = ${formatarNumero(divContrato)}; vale o divisor mais favorável ao empregado`,
          null, j.params.divisor, { unidade: 'horas' }));
      }
    }
    if (divisorUsado === j.divisor) {
      passos.push(passo('divisor', 'Divisor do salário-hora', `Jornada de ${j.jornada} h por semana: divisor ${j.divisor}`, null, j.params.divisor, { unidade: 'horas' }));
    }
  } else {
    valorHoraBase = lerDinheiroCampo(entrada, 'valorHora', 'o valor por hora', alertas, { obrigatorio: true });
    if (valorHoraBase !== null && horasSemana !== null) {
      salario = multiplicar(valorHoraBase, horasSemana * j.fatorMensal);
      passos.push(passo('salario', 'Salário mensal do horista',
        `${formatarBRL(valorHoraBase)} × ${formatarNumero(horasSemana)} h/semana × ${formatarNumero(j.fatorMensal)} (= divisor ${j.params.divisor.valor} ÷ ${j.jornada} h; inclui o repouso semanal remunerado) = ${formatarBRL(salario)}`,
        salario, j.params.divisor));
    }
  }

  const res = {
    tipo,
    salario: salario || 0,
    jornada_semanal: j.jornada,
    divisor: divisorUsado,
    valor_hora: 0,
    horas_extras: 0,
    domingo_feriado: 0,
    adicional_noturno: 0,
    hora_noturna_reduzida: 0,
    bruto: 0,
    inss: 0,
    irrf: 0,
    vt_desconto: 0,
    vt_empregador: 0,
    salario_familia: 0,
    salario_familia_deduzido: 0,
    salario_familia_reembolso: 0,
    liquido: 0,
    encargos: { cpp: 0, gilrat: 0, fgts: 0, indenizacao: 0, total: 0 },
    dae: 0,
    dae_vencimento: null,
    custo_mensal: 0,
    provisoes: null,
    decimo_terceiro: null,
    custo_anual: 0,
    guardar_por_mes: 0,
  };

  if (salario === null) {
    alertas.push(...alertasMudancaJornada(data, overrides));
    return montar({ entrada, resultado: res, passos, alertas, data });
  }

  // valor da hora normal (para extras e noturno)
  // mensalista: salário ÷ divisor, sem arredondar no meio; horista: o valor combinado
  const valorDeHoras = (mult, horas) => (tipo === 'horista'
    ? multiplicar(valorHoraBase, mult * horas)
    : fracao(salario, Math.round(mult * horas * 1000000), Math.round(divisorUsado * 1000000)));
  res.valor_hora = tipo === 'horista' ? valorHoraBase : fracao(salario, 100, Math.round(divisorUsado * 100));
  if (tipo === 'mensalista') {
    passos.push(passo('valor_hora', 'Valor da hora normal', `${formatarBRL(salario)} ÷ ${formatarNumero(divisorUsado)} = ${formatarBRL(res.valor_hora)}`, res.valor_hora, j.params.divisor));
  }

  // horas extras a 50%
  const pExtra = getParam('hora_extra', data);
  const horasExtras = lerNumeroCampo(entrada, 'horasExtras', 'as horas extras', alertas, { min: 0, max: 400 }) || 0;
  if (horasExtras > 0) {
    const pct = pExtra.valor.percentual_minimo;
    res.horas_extras = valorDeHoras(1 + pct / 100, horasExtras);
    passos.push(passo('horas_extras', `Horas extras (${pct}%)`, `${formatarNumero(horasExtras)} h × ${formatarBRL(res.valor_hora)} × ${formatarNumero(1 + pct / 100)} = ${formatarBRL(res.horas_extras)}`, res.horas_extras, pExtra));
    alertas.push(alerta('info', 'dsr_extras_nao_calculado', 'Reflexo das extras no repouso não calculado',
      'Horas extras habituais também entram no repouso semanal remunerado (Lei 605, art. 7º). A fórmula usada no mercado para esse reflexo não foi verificada em norma e não entra nesta conta.',
      FONTES.lei605));
  }

  // domingos e feriados não compensados
  const horasDF = lerNumeroCampo(entrada, 'horasDomingoFeriado', 'as horas em domingo ou feriado', alertas, { min: 0, max: 400 }) || 0;
  if (horasDF > 0) {
    const dobro = entrada.pagarDobroDomingoFeriado !== false;
    const pDobro = getParam('dobro_domingo_feriado_domestico', data);
    const mult = dobro ? 1 + pDobro.valor.percentual / 100 : 1 + pExtra.valor.percentual_minimo / 100;
    res.domingo_feriado = valorDeHoras(mult, horasDF);
    passos.push(passo('domingo_feriado', dobro ? 'Domingo ou feriado não compensado (em dobro)' : 'Domingo ou feriado (como hora extra)',
      `${formatarNumero(horasDF)} h × ${formatarBRL(res.valor_hora)} × ${formatarNumero(mult)} = ${formatarBRL(res.domingo_feriado)}, além do repouso já incluído no salário`,
      res.domingo_feriado, dobro ? pDobro : pExtra));
    const pRep = getParam('repouso_semanal_dias', data, overrides.jornada_datas ? { jornada_datas: overrides.jornada_datas } : {});
    if (pRep.valor === 2) {
      alertas.push(alerta('atencao', 'segundo_repouso_nao_verificado', 'Segundo dia de repouso: regra ainda não publicada',
        'Desde a EC 141 são 2 dias de repouso por semana. Como fica o pagamento do trabalho no 2º dia de repouso depende de ato do Ministério do Trabalho e Emprego (Decreto 13.173/2026, art. 4º), ainda não publicado.',
        FONTES.decreto13173, { status: 'nao_verificado' }));
    }
  }

  // adicional noturno e hora reduzida
  const horasNoturnas = lerNumeroCampo(entrada, 'horasNoturnas', 'as horas noturnas', alertas, { min: 0, max: 400 }) || 0;
  if (horasNoturnas > 0) {
    const pN = getParam('adicional_noturno', data);
    const reduzidas = (horasNoturnas * 3600) / pN.valor.hora_noturna_segundos; // ×8/7
    res.adicional_noturno = valorDeHoras(pN.valor.percentual_minimo / 100, reduzidas);
    passos.push(passo('hora_noturna', 'Horas noturnas contadas (hora de 52 min 30 s)', `${formatarNumero(horasNoturnas)} h de relógio × 60 ÷ 52,5 = ${formatarNumero(reduzidas, 2)} h`, null, pN, { unidade: 'horas' }));
    passos.push(passo('adicional_noturno', `Adicional noturno (${pN.valor.percentual_minimo}%)`, `${formatarNumero(reduzidas, 2)} h × ${formatarBRL(res.valor_hora)} × ${pN.valor.percentual_minimo}% = ${formatarBRL(res.adicional_noturno)}`, res.adicional_noturno, pN));
    if (tipo === 'horista') {
      res.hora_noturna_reduzida = valorDeHoras(1, reduzidas - horasNoturnas);
      passos.push(passo('hora_reduzida', 'Horas a mais pela hora noturna reduzida', `(${formatarNumero(reduzidas, 2)} − ${formatarNumero(horasNoturnas)}) h × ${formatarBRL(valorHoraBase)} = ${formatarBRL(res.hora_noturna_reduzida)}`, res.hora_noturna_reduzida, pN));
    } else {
      alertas.push(alerta('info', 'hora_reduzida_mensalista', 'Hora noturna reduzida do mensalista não entrou na conta',
        `As ${formatarNumero(horasNoturnas)} h de relógio à noite contam como ${formatarNumero(reduzidas, 2)} h (hora de 52 min 30 s). Para o mensalista, o app só soma o adicional de ${pN.valor.percentual_minimo}% e supõe que essas horas cabem na jornada paga pelo salário. Se, com a redução, a jornada passar do limite (8 h por dia ou a jornada semanal), o excedente é hora extra: informe essas horas em "horas extras".`,
        pN.fonte_url, { lei: 'LC 150, art. 14, §§ 1º e 2º' }));
    }
  }

  res.bruto = salario + res.horas_extras + res.domingo_feriado + res.adicional_noturno + res.hora_noturna_reduzida;
  passos.push(passo('bruto', 'Remuneração bruta', `Salário + extras + domingos/feriados + noturno = ${formatarBRL(res.bruto)}`, res.bruto));

  // INSS e IRRF do empregado
  const ri = inssProgressivo(res.bruto, data, overrides);
  if (ri.param.fora_da_vigencia) alertas.push(alertaForaDaVigencia(ri.param, data));
  res.inss = ri.valor;
  passos.push(...passosInss(ri, 'inss', 'INSS do empregado'));
  const dependentes = lerNumeroCampo(entrada, 'dependentes', 'dependentes', alertas, { min: 0, max: 50 }) || 0;
  const rir = irrfMensal(res.bruto, res.inss, dependentes, data, overrides);
  res.irrf = rir.valor;
  passos.push(...passosIrrf(rir, res.bruto));

  // salário-família
  const filhos = lerNumeroCampo(entrada, 'filhosSalarioFamilia', 'filhos com direito ao salário-família', alertas, { min: 0, max: 30 }) || 0;
  if (filhos > 0) {
    const pSF = getParamComReserva('salario_familia', data, overrides);
    if (res.bruto <= pSF.valor.limite_remuneracao) {
      res.salario_familia = pSF.valor.cota_por_filho * Math.floor(filhos);
      passos.push(passo('salario_familia', 'Salário-família (pago pelo empregador e abatido do DAE)', `${Math.floor(filhos)} × ${formatarBRL(pSF.valor.cota_por_filho)} = ${formatarBRL(res.salario_familia)}`, res.salario_familia, pSF));
    } else {
      passos.push(passo('salario_familia', 'Salário-família', `Remuneração acima de ${formatarBRL(pSF.valor.limite_remuneracao)}: sem direito`, 0, pSF));
    }
  }

  // vale-transporte
  const custoVt = lerDinheiroCampo(entrada, 'custoVtMes', 'o custo do vale-transporte', alertas) || 0;
  if (custoVt > 0) {
    const pVt = getParam('vt_desconto', data);
    if (entrada.recusaVt) {
      res.vt_desconto = 0;
      res.vt_empregador = 0;
      passos.push(passo('vt_desconto', 'Vale-transporte: empregado recusou', 'Sem vale, sem desconto', 0, pVt));
      passos.push(passo('vt_empregador', 'Vale-transporte pago pelo empregador', 'Empregado recusou o vale: sem custo', 0, pVt));
    } else {
      let teto = aplicarPct(salario, pVt.valor.aliquota_pct);
      let textoTeto = `${formatarPct(pVt.valor.aliquota_pct)} × ${formatarBRL(salario)} (salário básico) = ${formatarBRL(teto)}`;
      const diasVale = lerNumeroCampo(entrada, 'diasComVale', 'os dias com vale', alertas, { min: 0, max: 31 });
      const diasUteis = lerNumeroCampo(entrada, 'diasUteisMes', 'os dias úteis do mês', alertas, { min: 1, max: 31 });
      if (diasVale !== null && diasUteis && diasVale < diasUteis) {
        teto = fracao(teto, Math.round(diasVale * 100), Math.round(diasUteis * 100));
        textoTeto += ` × ${formatarNumero(diasVale)}/${formatarNumero(diasUteis)} dias com vale = ${formatarBRL(teto)}`;
      }
      res.vt_desconto = Math.min(teto, custoVt);
      passos.push(passo('vt_desconto', 'Vale-transporte descontado do empregado',
        `Menor entre ${textoTeto} e o custo do vale ${formatarBRL(custoVt)} = ${formatarBRL(res.vt_desconto)} (você não paga mais do que o vale custa)`,
        res.vt_desconto, pVt));
      res.vt_empregador = custoVt - res.vt_desconto;
      passos.push(passo('vt_empregador', 'Vale-transporte pago pelo empregador', `${formatarBRL(custoVt)} − ${formatarBRL(res.vt_desconto)} = ${formatarBRL(res.vt_empregador)}`, res.vt_empregador, pVt));
    }
  }

  res.liquido = res.bruto - res.inss - res.irrf - res.vt_desconto + res.salario_familia;
  passos.push(passo('liquido', 'Líquido do empregado',
    `${formatarBRL(res.bruto)} − INSS ${formatarBRL(res.inss)} − IRRF ${formatarBRL(res.irrf)} − VT ${formatarBRL(res.vt_desconto)}${res.salario_familia ? ` + salário-família ${formatarBRL(res.salario_familia)}` : ''} = ${formatarBRL(res.liquido)}`,
    res.liquido));

  // encargos do empregador (20%; CPP e GILRAT até o teto do INSS)
  const pEnc = getParamComReserva('encargos_domestico', data, overrides);
  const e = pEnc.valor;
  const teto = ri.teto;
  const encMesCalc = encargosDomestico(res.bruto, teto, e);
  res.encargos = { cpp: encMesCalc.cpp, gilrat: encMesCalc.gilrat, fgts: encMesCalc.fgts, indenizacao: encMesCalc.indenizacao, total: encMesCalc.total };
  res.encargos.base_cpp_gilrat = encMesCalc.base_inss;
  const textoBaseInss = encMesCalc.limitado
    ? `${formatarBRL(teto)} (salário de contribuição limitado ao teto do INSS; Lei 8.212, art. 24 e art. 28, §5º)`
    : formatarBRL(res.bruto);
  const pEncTeto = { ...pEnc, lei: `${pEnc.lei}; teto: Lei 8.212, art. 28, §5º` };
  passos.push(passo('cpp', 'INSS patronal (CPP)', `${formatarPct(e.cpp_pct)} × ${textoBaseInss} = ${formatarBRL(res.encargos.cpp)}`, res.encargos.cpp, encMesCalc.limitado ? pEncTeto : pEnc));
  passos.push(passo('gilrat', 'Seguro contra acidente (GILRAT)', `${formatarPct(e.gilrat_pct)} × ${textoBaseInss} = ${formatarBRL(res.encargos.gilrat)}`, res.encargos.gilrat, encMesCalc.limitado ? pEncTeto : pEnc));
  passos.push(passo('fgts', 'FGTS', `${formatarPct(e.fgts_pct)} × ${formatarBRL(res.bruto)} = ${formatarBRL(res.encargos.fgts)}`, res.encargos.fgts, pEnc));
  passos.push(passo('indenizacao', 'Indenização compensatória (multa do FGTS antecipada)', `${formatarPct(e.indenizacao_pct)} × ${formatarBRL(res.bruto)} = ${formatarBRL(res.encargos.indenizacao)}`, res.encargos.indenizacao, pEnc));
  passos.push(passo('encargos', encMesCalc.limitado ? 'Sua parte no DAE (CPP e GILRAT até o teto)' : 'Sua parte no DAE (20%)', `${formatarBRL(res.encargos.cpp)} + ${formatarBRL(res.encargos.gilrat)} + ${formatarBRL(res.encargos.fgts)} + ${formatarBRL(res.encargos.indenizacao)} = ${formatarBRL(res.encargos.total)}`, res.encargos.total, pEnc));

  // DAE: o salário-família só abate até o total das contribuições previdenciárias
  // (INSS do empregado + CPP + GILRAT); o que passar vira pedido de reembolso à Receita.
  const limiteSF = res.inss + res.encargos.cpp + res.encargos.gilrat;
  res.salario_familia_deduzido = Math.min(res.salario_familia, limiteSF);
  res.salario_familia_reembolso = res.salario_familia - res.salario_familia_deduzido;
  if (res.salario_familia_reembolso > 0) {
    passos.push(passo('salario_familia_reembolso', 'Salário-família acima do limite de dedução',
      `Dedução limitada a INSS do empregado ${formatarBRL(res.inss)} + CPP ${formatarBRL(res.encargos.cpp)} + GILRAT ${formatarBRL(res.encargos.gilrat)} = ${formatarBRL(limiteSF)}. Os ${formatarBRL(res.salario_familia_reembolso)} restantes não saem do DAE: peça o reembolso à Receita Federal.`,
      res.salario_familia_reembolso, null, { fonte_url: FONTES.manualEsocialDomestico, lei: 'Manual do eSocial Doméstico de 13/08/2026, item 4.2 (salário-família) e 4.3.5' }));
    alertas.push(alerta('info', 'salario_familia_reembolso', 'Parte do salário-família vira reembolso',
      `O salário-família (${formatarBRL(res.salario_familia)}) passa do total das contribuições previdenciárias do mês (${formatarBRL(limiteSF)}). O DAE abate só ${formatarBRL(res.salario_familia_deduzido)}; os ${formatarBRL(res.salario_familia_reembolso)} restantes você pede de volta à Receita Federal.`,
      FONTES.manualEsocialDomestico));
  }
  res.dae = res.encargos.total + res.inss + res.irrf - res.salario_familia_deduzido;
  const venc = vencimentoDae(data);
  res.dae_vencimento = venc.vencimento;
  passos.push(passo('dae', 'DAE do mês (guia única do eSocial)',
    `Sua parte ${formatarBRL(res.encargos.total)} + INSS do empregado ${formatarBRL(res.inss)} + IRRF ${formatarBRL(res.irrf)}${res.salario_familia_deduzido ? ` − salário-família ${formatarBRL(res.salario_familia_deduzido)}` : ''} = ${formatarBRL(res.dae)}; vence em ${formatarDataBR(venc.vencimento)} (dia 20 do mês seguinte, antecipado se não for dia útil; feriados locais não considerados)`,
    res.dae, venc.param));

  // custo mensal
  res.custo_mensal = res.bruto + res.encargos.total + res.vt_empregador;
  passos.push(passo('custo_mensal', 'Você paga por mês',
    `Remuneração ${formatarBRL(res.bruto)} + encargos ${formatarBRL(res.encargos.total)} + VT do empregador ${formatarBRL(res.vt_empregador)} = ${formatarBRL(res.custo_mensal)}`,
    res.custo_mensal));

  // tempo parcial e férias
  const tp = alertasTempoParcialDomestico(horasSemana, data);
  alertas.push(...tp.alertas);
  const diasFerias = tp.dias_ferias || 30;

  // provisões (base: remuneração do mês; supõe extras e noturno habituais)
  // Encargos anuais: 13º com teto próprio (INSS em separado); 1/3 de férias = encargos a mais no
  // mês de férias (remuneração + 1/3, com CPP e GILRAT até o teto) em relação a um mês comum.
  const prov13 = fracao(res.bruto, 1, 12);
  const terco = fracao(res.bruto, diasFerias, 30 * 3); // 1/3 das férias
  const provTerco = fracao(res.bruto, diasFerias, 30 * 3 * 12);
  const provFeriasCompleta = fracao(res.bruto, diasFerias * 4, 30 * 3 * 12);
  const enc13Ano = encargosDomestico(res.bruto, teto, e).total;
  const encTercoAno = encargosDomestico(res.bruto + terco, teto, e).total - res.encargos.total;
  const encFeriasTercoAno = encargosDomestico(fracao(res.bruto, diasFerias, 30) + terco, teto, e).total;
  const enc13 = fracao(enc13Ano, 1, 12);
  const encTerco = fracao(encTercoAno, 1, 12);
  const textoEnc = encMesCalc.limitado ? 'encargos (CPP e GILRAT até o teto)' : 'encargos 20%';
  res.provisoes = {
    decimo_terceiro: prov13,
    encargos_decimo_terceiro: enc13,
    ferias_mais_terco: provFeriasCompleta,
    terco_ferias: provTerco,
    encargos_terco_ferias: encTerco,
    encargos_ferias_mais_terco: fracao(encFeriasTercoAno, 1, 12),
    dias_ferias: diasFerias,
  };
  res.guardar_por_mes = prov13 + enc13 + provTerco + encTerco;
  passos.push(passo('prov_13', 'Provisão do 13º por mês', `${formatarBRL(res.bruto)} ÷ 12 = ${formatarBRL(prov13)}; ${textoEnc} do 13º ${formatarBRL(enc13Ano)} ÷ 12 = ${formatarBRL(enc13)}`, prov13, getParam('prazos_13', data)));
  passos.push(passo('prov_ferias', 'Provisão de férias + 1/3 por mês',
    `${formatarBRL(res.bruto)} × ${diasFerias}/30 × 4/3 ÷ 12 = ${formatarBRL(provFeriasCompleta)}. O salário das férias já está nos 12 salários do ano; o gasto a mais é só o 1/3: ${formatarBRL(provTerco)} por mês + ${textoEnc} ${formatarBRL(encTercoAno)} ÷ 12 = ${formatarBRL(encTerco)}`,
    provFeriasCompleta, null, { fonte_url: FONTES.lc150, lei: 'LC 150, arts. 3º e 17' }));
  passos.push(passo('guardar', 'Quanto guardar por mês (13º e 1/3 de férias, com encargos)',
    `${formatarBRL(prov13)} + ${formatarBRL(enc13)} + ${formatarBRL(provTerco)} + ${formatarBRL(encTerco)} = ${formatarBRL(res.guardar_por_mes)}`,
    res.guardar_por_mes));

  // 13º: INSS em separado, 1ª parcela sem INSS
  const ri13 = inssProgressivo(res.bruto, data, overrides);
  const rir13 = irrfMensal(res.bruto, ri13.valor, dependentes, data, overrides, { permitirSimplificado: false });
  const primeira = fracao(res.bruto, 1, 2);
  res.decimo_terceiro = {
    bruto: res.bruto,
    primeira_parcela: primeira,
    inss: ri13.valor,
    irrf: rir13.valor,
    segunda_parcela: res.bruto - primeira - ri13.valor - rir13.valor,
    encargos: enc13Ano,
  };
  const p13 = getParam('prazos_13', data);
  const pInss13 = getParam('inss_13_separado', data);
  passos.push(passo('decimo_primeira', '13º: 1ª parcela (até 30/11, sem INSS)', `${formatarBRL(res.bruto)} ÷ 2 = ${formatarBRL(primeira)}`, primeira, p13));
  passos.push(passo('decimo_inss', '13º: INSS em separado (tabela inteira sobre o 13º bruto)', `Tabela progressiva sobre ${formatarBRL(res.bruto)}, sem somar ao salário do mês = ${formatarBRL(ri13.valor)}`, ri13.valor, pInss13));
  passos.push(passo('decimo_irrf', '13º: IRRF (tributação exclusiva, com a redução da Lei 15.270)', `Base ${formatarBRL(rir13.legal.base)} (13º − INSS − dependentes) = ${formatarBRL(rir13.valor)}. O desconto simplificado não foi aplicado ao 13º (não verificado).`, rir13.valor, rir13.params.tabela, { status: 'nao_verificado' }));
  passos.push(passo('decimo_segunda', '13º: 2ª parcela (até 20/12)', `${formatarBRL(res.bruto)} − ${formatarBRL(primeira)} − INSS ${formatarBRL(ri13.valor)} − IRRF ${formatarBRL(rir13.valor)} = ${formatarBRL(res.decimo_terceiro.segunda_parcela)}`, res.decimo_terceiro.segunda_parcela, p13));

  // custo anual
  const encMes = res.encargos.total;
  res.custo_anual = 12 * (res.bruto + encMes) + 11 * res.vt_empregador
    + res.bruto + res.decimo_terceiro.encargos + terco + encTercoAno;
  passos.push(passo('custo_anual', 'Custo por ano',
    `12 × (${formatarBRL(res.bruto)} + ${formatarBRL(encMes)}) + 11 × VT ${formatarBRL(res.vt_empregador)} (sem vale nas férias) + 13º ${formatarBRL(res.bruto)} + encargos ${formatarBRL(res.decimo_terceiro.encargos)} + 1/3 de férias ${formatarBRL(terco)} + encargos ${formatarBRL(encTercoAno)} = ${formatarBRL(res.custo_anual)}`,
    res.custo_anual));

  // alertas
  const proporcao = horasSemana && horasSemana < j.jornada ? horasSemana / j.jornada : 1;
  const as = alertasSalarioMensal(salario, data, { uf: entrada.uf || null, overrides, proporcao, grupoPR: entrada.grupoPR || null });
  alertas.push(...as.alertas);
  res.piso_aplicado = Math.round(as.piso.valor * proporcao);
  if (horasSemana && horasSemana > j.jornada) {
    alertas.push(alerta('atencao', 'acima_jornada', `Acima de ${j.jornada} h por semana`,
      `${formatarNumero(horasSemana)} h por semana passa da jornada máxima de ${j.jornada} h; o que passar é hora extra (pelo menos 50% a mais).`,
      j.params.jornada.fonte_url));
  }
  alertas.push(...alertasMudancaJornada(data, overrides));
  alertas.push(alerta('info', 'estimativa', 'Estimativa educativa',
    'Não substitui contador, advogado nem a folha do eSocial. O valor oficial é o do eSocial.', FONTES.manualEsocialDomestico));

  return montar({ entrada, resultado: res, passos, alertas, data });
}
