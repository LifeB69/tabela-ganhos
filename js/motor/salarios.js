// Tabela de salários: conversor hora/dia/semana/mês/ano, salário mínimo, pisos e comparação.
import { getParam, listarVigencias, listarMudancasFuturas, PARAMETROS, UFS } from './parametros.js';
import { montar, passo, alerta, resolverData, lerDinheiroCampo, lerNumeroCampo, multiplicar, fracao, normalizarEntrada } from './comum.js';
import { formatarBRL, formatarNumero } from './dinheiro.js';
import { obterJornada, obterMinimo, horaMinima, pisoDomestico } from './jornada.js';
import { alertasValorHora, alertasMudancaJornada } from './alertas.js';

const UNIDADES = ['hora', 'dia', 'semana', 'mes', 'ano'];

/**
 * Conversor: converterSalario({ valor, unidade, horasDia?, diasSemana?, metodo? }, dataISO, opcoes)
 * metodo 'legal' (padrão): mês = horas/semana × (divisor ÷ jornada) × valor-hora (inclui o repouso,
 *   como o divisor 220 = 44 × 5); dia = mês ÷ 30 (salário-dia, LC 150 art. 2º, §3º).
 * metodo 'calendario': mês = semana × 52 ÷ 12; dia = valor de um dia trabalhado.
 * Ano = 12 meses (e ano_com_13_e_ferias = 12 + 1 + 1/3 meses, para empregado).
 */
export function converterSalario(entrada = {}, dataISO, opcoes = {}) {
  entrada = normalizarEntrada(entrada);
  opcoes = opcoes || {};
  const alertas = [];
  const passos = [];
  const data = resolverData(dataISO, alertas);
  const overrides = opcoes.overrides || {};
  const valor = lerDinheiroCampo(entrada, 'valor', 'o valor', alertas, { obrigatorio: true });
  const unidade = UNIDADES.includes(entrada.unidade) ? entrada.unidade : 'hora';
  const j = obterJornada(data, overrides);
  const horasDia = lerNumeroCampo(entrada, 'horasDia', 'as horas por dia', alertas, { min: 0.1, max: 24 }) || 8;
  const diasSemanaPadrao = Math.round((j.jornada / 8) * 100) / 100; // 44 h ÷ 8 = 5,5 dias
  const diasSemana = lerNumeroCampo(entrada, 'diasSemana', 'os dias por semana', alertas, { min: 0.1, max: 7 }) || diasSemanaPadrao;
  const metodo = entrada.metodo === 'calendario' ? 'calendario' : 'legal';
  const horasSemana = horasDia * diasSemana;
  const fatorMes = metodo === 'legal' ? horasSemana * j.fatorMensal : (horasSemana * 52) / 12; // horas por mês

  const res = { hora: 0, dia: 0, semana: 0, mes: 0, ano: 0, ano_com_13_e_ferias: 0, horas_mes: Math.round(fatorMes * 100) / 100, metodo };
  if (valor === null) return montar({ entrada, resultado: res, passos, alertas, data });

  // tudo passa pelo valor-hora exato (fração), arredondando só cada saída
  // hora = valor ÷ (horas da unidade)
  const horasPor = {
    hora: 1,
    semana: horasSemana,
    mes: fatorMes,
    ano: fatorMes * 12,
    dia: metodo === 'legal' ? fatorMes / 30 : horasDia,
  };
  const escala = 1000000;
  const hUnidade = Math.round(horasPor[unidade] * escala);
  for (const u of UNIDADES) {
    res[u] = u === unidade ? valor : fracao(valor, Math.round(horasPor[u] * escala), hUnidade);
  }
  res.ano_com_13_e_ferias = fracao(res.mes, 40, 3); // 12 + 1 + 1/3 = 40/3
  passos.push(passo('horas_mes', 'Horas por mês',
    metodo === 'legal'
      ? `${formatarNumero(horasDia)} h × ${formatarNumero(diasSemana)} dias = ${formatarNumero(horasSemana)} h/semana × ${formatarNumero(j.fatorMensal)} (divisor ${j.params.divisor.valor} ÷ ${j.jornada} h, inclui repouso) = ${formatarNumero(fatorMes, 2)} h`
      : `${formatarNumero(horasSemana)} h/semana × 52 ÷ 12 = ${formatarNumero(fatorMes, 2)} h`,
    null, metodo === 'legal' ? j.params.divisor : null, { unidade: 'horas' }));
  passos.push(passo('conversao', 'Conversão', `Hora ${formatarBRL(res.hora)} · dia ${formatarBRL(res.dia)} · semana ${formatarBRL(res.semana)} · mês ${formatarBRL(res.mes)} · ano ${formatarBRL(res.ano)}`, res.mes));
  passos.push(passo('ano_13', 'Ano com 13º e 1/3 de férias (empregado)', `${formatarBRL(res.mes)} × (12 + 1 + 1/3) = ${formatarBRL(res.ano_com_13_e_ferias)}`, res.ano_com_13_e_ferias));
  const av = alertasValorHora(res.hora, data, { uf: entrada.uf || null, overrides, nivel: 'info' });
  alertas.push(...av.alertas);
  return montar({ entrada, resultado: res, passos, alertas, data });
}

/** Salário mínimo na data: mensal, diário, hora, jornada, divisor e o previsto (sem usar). */
export function tabelaMinimo(dataISO, opcoes = {}) {
  const alertas = [];
  const data = resolverData(dataISO, alertas);
  const overrides = opcoes.overrides || {};
  const min = obterMinimo(data, overrides);
  const hm = horaMinima(data, overrides);
  const j = obterJornada(data, overrides);
  alertas.push(...hm.alertas, ...j.alertas, ...alertasMudancaJornada(data, overrides));
  const previstos = listarVigencias('salario_minimo').filter((v) => v.status === 'previsto' && v.vigente_desde > min.param.vigente_desde);
  const resultado = {
    mensal: min.mensal,
    diario: min.diario,
    diario_derivado: !!min.diario_derivado,
    hora: hm.valor,
    hora_derivada: hm.derivado,
    jornada_semanal: j.jornada,
    divisor: j.divisor,
    repouso_dias: j.repouso,
    fonte_url: min.param.fonte_url,
    lei: min.param.lei,
    previstos: previstos.map((v) => ({ mensal: v.valor.mensal, vigente_desde: v.vigente_desde, status: v.status, fonte_url: v.fonte_url, lei: v.lei, observacao: v.observacao })),
  };
  const passos = [
    passo('minimo_mensal', 'Salário mínimo mensal', formatarBRL(min.mensal), min.mensal, min.param),
    passo('minimo_diario', min.diario_derivado ? 'Salário mínimo por dia (conta do app)' : 'Salário mínimo por dia',
      min.diario_derivado ? `Conta do app: ${formatarBRL(min.mensal)} ÷ 30 = ${formatarBRL(min.diario)}` : formatarBRL(min.diario), min.diario, min.param),
    hm.passo,
  ];
  return montar({ entrada: { data }, resultado, passos, alertas, data });
}

/** Pisos do doméstico por UF (SP, RS, SC, PR, RJ) e "demais = mínimo". */
export function tabelaPisos(dataISO, opcoes = {}) {
  const alertas = [];
  const data = resolverData(dataISO, alertas);
  const overrides = opcoes.overrides || {};
  const j = obterJornada(data, overrides);
  const min = obterMinimo(data, overrides);
  const linhas = [];
  const comPiso = PARAMETROS.filter((p) => p.chave.startsWith('piso_domestico_')).map((p) => p.uf);
  for (const uf of comPiso) {
    const r = pisoDomestico(uf, data, overrides);
    const info = getParam(`piso_domestico_${uf}`, data, {}, { incluirNaoVerificados: true });
    const piso = r.piso_estadual !== null ? r.piso_estadual : info ? info.valor : null;
    linhas.push({
      uf,
      piso_estadual: piso,
      status: info ? info.status : 'sem_vigencia',
      usado_no_calculo: r.valor,
      origem: r.origem,
      hora: fracao(r.valor, 1, j.divisor),
      vigente_desde: info ? info.vigente_desde : null,
      vigente_ate: info ? info.vigente_ate : null,
      fonte_url: info ? info.fonte_url : null,
      lei: info ? info.lei : null,
      observacao: info ? info.observacao : null,
      grupos: info && info.grupos ? info.grupos : undefined,
    });
  }
  linhas.push({
    uf: 'demais',
    ufs: UFS.filter((u) => !comPiso.includes(u)),
    piso_estadual: null,
    status: 'vigente',
    usado_no_calculo: min.mensal,
    origem: 'minimo',
    hora: fracao(min.mensal, 1, j.divisor),
    vigente_desde: min.param.vigente_desde,
    vigente_ate: null,
    fonte_url: min.param.fonte_url,
    lei: min.param.lei,
    observacao: 'Sem piso estadual conferido: vale o mínimo nacional. Piso de convenção coletiva prevalece.',
  });
  alertas.push(alerta('info', 'piso_convencao', 'Convenção coletiva prevalece',
    'O piso estadual não vale onde houver piso de convenção ou acordo coletivo da categoria. O cálculo usa o maior entre o piso estadual e o mínimo nacional.', null));
  return montar({ entrada: { data }, resultado: { divisor: j.divisor, linhas }, passos: [], alertas, data });
}

/**
 * Tabela de comparação: até 5 valores-hora livres + coluna do mínimo.
 * tabelaComparacao({ valoresHora: [1500, 2000], horasDia: 4, dias: 10 }, dataISO)
 */
export function tabelaComparacao(entrada = {}, dataISO, opcoes = {}) {
  entrada = normalizarEntrada(entrada);
  opcoes = opcoes || {};
  const alertas = [];
  const data = resolverData(dataISO, alertas);
  const horasDia = lerNumeroCampo(entrada, 'horasDia', 'as horas por dia', alertas, { obrigatorio: true, min: 0, max: 24 }) || 0;
  const dias = lerNumeroCampo(entrada, 'dias', 'os dias', alertas, { obrigatorio: true, min: 0, max: 366 }) || 0;
  const hm = horaMinima(data, opcoes.overrides || {});
  const lista = (Array.isArray(entrada.valoresHora) ? entrada.valoresHora : []).slice(0, 5);
  const colunas = lista.map((v, i) => {
    const c = lerDinheiroCampo({ v }, 'v', `o valor ${i + 1}`, alertas);
    return { rotulo: c === null ? '—' : formatarBRL(c), valor_hora: c || 0, minimo: false };
  });
  colunas.push({ rotulo: hm.derivado ? 'Mínimo proporcional (conta do app)' : 'Mínimo legal', valor_hora: hm.valor, minimo: true });
  for (const c of colunas) {
    c.dia = multiplicar(c.valor_hora, horasDia);
    c.total = multiplicar(c.valor_hora, horasDia * dias);
    c.abaixo_minimo = !c.minimo && c.valor_hora < hm.valor;
  }
  if (colunas.some((c) => c.abaixo_minimo)) {
    alertas.push(alerta('atencao', 'abaixo_minimo', hm.derivado ? 'Há valor abaixo do mínimo mensal proporcional (conta do app)' : 'Há valor abaixo do mínimo por hora',
      hm.derivado
        ? `A referência é o mínimo mensal ÷ ${hm.divisor} h = ${formatarBRL(hm.valor)} por hora (conta do app; o decreto do mínimo fixa outro valor por hora).`
        : `O mínimo por hora é ${formatarBRL(hm.valor)}.`, hm.passo.fonte_url));
  }
  alertas.push(...hm.alertas);
  return montar({ entrada, resultado: { horas_dia: horasDia, dias, colunas }, passos: [hm.passo], alertas, data });
}

/** Lista as mudanças legais futuras a partir da data (para o aviso "o que vai mudar"). */
export function proximasMudancas(dataISO, limiteISO = null) {
  const alertas = [];
  const data = resolverData(dataISO, alertas);
  return montar({ entrada: { data, limite: limiteISO }, resultado: { mudancas: listarMudancasFuturas(data, limiteISO) }, passos: [], alertas, data });
}
