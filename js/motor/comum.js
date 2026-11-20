// Peças comuns: envelope do resultado, passos, alertas e leitura de entradas.
import { PARAMETROS_VERSAO, DATA_CONFERENCIA, dataValida } from './parametros.js';
import { lerCentavos, formatarBRL, LIMITE_CENTAVOS } from './dinheiro.js';

/** Monta o objeto de saída padrão de toda função de cálculo. */
export function montar({ entrada, resultado, passos = [], alertas = [], data }) {
  return {
    entrada,
    resultado,
    passos,
    alertas: deduplicar(alertas),
    parametros_versao: PARAMETROS_VERSAO,
    data_referencia: data,
  };
}

function deduplicar(alertas) {
  const vistos = new Set();
  return alertas.filter((a) => {
    const k = `${a.codigo}|${a.titulo}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

/** Cria um passo de "mostrar a conta". Se receber um parâmetro (vigência), usa a fonte dele. */
export function passo(id, rotulo, formula, valor, param = null, extra = {}) {
  return {
    id,
    rotulo,
    formula,
    valor: valor === null || valor === undefined ? null : Math.round(valor),
    fonte_url: extra.fonte_url !== undefined ? extra.fonte_url : param ? param.fonte_url : null,
    lei: extra.lei !== undefined ? extra.lei : param ? param.lei : null,
    ...(extra.status ? { status: extra.status } : {}),
    ...(param && param.editado_por_usuario ? { editado_por_usuario: true } : {}),
    ...(extra.unidade ? { unidade: extra.unidade } : {}),
  };
}

export function alerta(nivel, codigo, titulo, texto, fonte_url = null, extra = {}) {
  return { nivel, codigo, titulo, texto, fonte_url, ...extra };
}

/**
 * Resolve a data de referência. Sem data válida, usa DATA_CONFERENCIA e devolve um alerta.
 * Aceita também 'AAAA-MM' (usa o dia 1º).
 */
export function resolverData(dataISO, alertas) {
  if (typeof dataISO === 'string' && /^\d{4}-\d{2}$/.test(dataISO)) dataISO = `${dataISO}-01`;
  if (dataValida(dataISO)) return dataISO;
  alertas.push(alerta('atencao', 'data_invalida', 'Data de referência ausente ou inválida',
    `Usei a data da última conferência das leis (${formatarDataBR(DATA_CONFERENCIA)}). Informe a data no formato AAAA-MM-DD.`));
  return DATA_CONFERENCIA;
}

export function formatarDataBR(iso) {
  if (!dataValida(iso)) return String(iso);
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** Entrada null, número ou texto vira {} (o padrão `entrada = {}` só cobre undefined). */
export function normalizarEntrada(entrada) {
  return entrada && typeof entrada === 'object' ? entrada : {};
}

/** Lê um número (aceita "4,5"). Devolve null se vazio/ inválido. */
export function lerNumero(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(/\s/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Lê dinheiro (centavos ou texto). Se inválido/ausente e obrigatório, gera alerta de validação. */
export function lerDinheiroCampo(entrada, campo, rotulo, alertas, { obrigatorio = false } = {}) {
  const bruto = entrada ? entrada[campo] : undefined;
  const c = lerCentavos(bruto);
  // valor que não cabe em centavos inteiros seguros (ex.: 400 dígitos) ou passa de R$ 1 bilhão
  const grandeDemais = (c !== null && Math.abs(c) > LIMITE_CENTAVOS)
    || (c === null && typeof bruto === 'number' && Number.isFinite(bruto))
    || (c === null && typeof bruto === 'string' && /\d{16,}/.test(bruto.replace(/[.,\s]/g, '')));
  if (grandeDemais) {
    alertas.push(alerta('atencao', 'entrada_invalida', 'Valor alto demais',
      `${rotulo.charAt(0).toUpperCase()}${rotulo.slice(1)} passa do limite do app (${formatarBRL(LIMITE_CENTAVOS)}). Confira o valor digitado.`, null, { campo }));
    return null;
  }
  if (c === null) {
    if (obrigatorio || (bruto !== undefined && bruto !== null && bruto !== '')) {
      alertas.push(alerta('atencao', 'entrada_invalida', `Falta ${rotulo}`,
        `Preencha ${rotulo} com um valor em reais (ex.: 1.621,00).`, null, { campo }));
    }
    return null;
  }
  if (c < 0) {
    alertas.push(alerta('atencao', 'entrada_invalida', `${rotulo} negativo`, `${rotulo} não pode ser negativo.`, null, { campo }));
    return null;
  }
  return c;
}

export function lerNumeroCampo(entrada, campo, rotulo, alertas, { obrigatorio = false, min = 0, max = Infinity } = {}) {
  const bruto = entrada ? entrada[campo] : undefined;
  const n = lerNumero(bruto);
  if (n === null) {
    if (obrigatorio || (bruto !== undefined && bruto !== null && bruto !== '')) {
      alertas.push(alerta('atencao', 'entrada_invalida', `Falta ${rotulo}`, `Preencha ${rotulo} com um número.`, null, { campo }));
    }
    return null;
  }
  if (n < min || n > max) {
    alertas.push(alerta('atencao', 'entrada_invalida', `${rotulo} fora do intervalo`,
      `${rotulo} deve ficar entre ${min} e ${max === Infinity ? 'sem limite' : max}.`, null, { campo }));
    return null;
  }
  return n;
}

export const brl = (c) => formatarBRL(c);

/** Multiplica centavos por um número decimal qualquer (ex.: horas 4,5) e arredonda. */
export function multiplicar(centavos, fator) {
  if (!Number.isFinite(centavos) || !Number.isFinite(fator)) return 0; // proteção: entrada já validada antes
  // fator em milionésimos inteiros e BigInt: sem ruído de ponto flutuante nem estouro
  const f = BigInt(Math.round(fator * 1000000));
  const num = BigInt(Math.round(centavos)) * f;
  const neg = num < 0n;
  const abs = neg ? -num : num;
  const r = Number((2n * abs + 1000000n) / 2000000n);
  return neg ? -r : r;
}

/**
 * centavos × a ÷ b com arredondamento meio para cima. a e b são arredondados para inteiros;
 * com b = 0 ou valor não finito devolve 0 (quem chama valida a entrada e avisa).
 */
export function fracao(centavos, a, b) {
  if (!Number.isFinite(centavos) || !Number.isFinite(a) || !Number.isFinite(b) || Math.round(b) === 0) return 0;
  const num = BigInt(Math.round(centavos)) * BigInt(Math.round(a));
  let den = BigInt(Math.round(b));
  if (den < 0n) { den = -den; return -fracao(centavos, a, -b); }
  const neg = num < 0n;
  const abs = neg ? -num : num;
  const r = Number((2n * abs + den) / (2n * den));
  return neg ? -r : r;
}
