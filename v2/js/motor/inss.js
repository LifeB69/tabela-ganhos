// INSS do empregado (inclusive doméstico), tabela progressiva.
import { getParamComReserva } from './parametros.js';
import { pctParaMilionesimos, dividirArredondando, formatarBRL, formatarPct, formatarNumero } from './dinheiro.js';
import { montar, passo, resolverData, lerDinheiroCampo, normalizarEntrada } from './comum.js';
import { alertaForaDaVigencia } from './jornada.js';

/**
 * Núcleo: INSS progressivo sobre uma base em centavos. Soma exata por faixa e arredonda só no fim.
 * Devolve { valor, base_limitada, faixas:[{de, ate, base, aliquota_pct, parcela_exata}], param }.
 * parcela_exata fica em CENTAVOS com casas decimais (ex.: 12157.5 = R$ 121,575); a tela divide por 100.
 */
export function inssProgressivo(baseCentavos, dataISO, overrides = {}) {
  const param = getParamComReserva('inss_empregado', dataISO, overrides);
  const { faixas, teto } = param.valor;
  const base = Math.max(0, Math.min(Math.round(baseCentavos || 0), teto));
  let anterior = 0;
  let soma = 0; // em centavos × milionésimos
  const detalhes = [];
  for (const f of faixas) {
    if (base <= anterior) break;
    const topo = Math.min(base, f.ate);
    const fatia = topo - anterior;
    const parcial = fatia * pctParaMilionesimos(f.aliquota_pct);
    soma += parcial;
    detalhes.push({ de: anterior, ate: topo, base: fatia, aliquota_pct: f.aliquota_pct, parcela_exata: parcial / 1000000 });
    anterior = f.ate;
  }
  return { valor: dividirArredondando(soma, 1000000), base_limitada: base, teto, faixas: detalhes, param };
}

/** Passos de "mostrar a conta" do INSS progressivo. */
export function passosInss(r, prefixo = 'inss', rotuloBase = 'INSS') {
  const passos = [];
  if (r.faixas.length === 1) {
    const f = r.faixas[0];
    passos.push(passo(`${prefixo}_total`, rotuloBase, `${rotuloBase} ${formatarPct(f.aliquota_pct)} × ${formatarBRL(f.base)} = ${formatarBRL(r.valor)}`, r.valor, r.param));
    return passos;
  }
  r.faixas.forEach((f, i) => {
    passos.push(passo(`${prefixo}_faixa_${i + 1}`, `${rotuloBase}: faixa ${i + 1}`,
      `${formatarPct(f.aliquota_pct)} × ${formatarBRL(f.base)} (de ${formatarBRL(f.de)} a ${formatarBRL(f.ate)}) = R$ ${formatarNumero(f.parcela_exata / 100, 4)}`,
      null, r.param));
  });
  passos.push(passo(`${prefixo}_total`, rotuloBase,
    `Soma das faixas, arredondada no fim${r.base_limitada === r.teto ? ` (base limitada ao teto de ${formatarBRL(r.teto)})` : ''} = ${formatarBRL(r.valor)}`,
    r.valor, r.param));
  return passos;
}

/**
 * calcularInss({ salario }, dataISO, { overrides })
 * salario: centavos (número) ou texto ("1.621,00").
 */
export function calcularInss(entrada = {}, dataISO, opcoes = {}) {
  entrada = normalizarEntrada(entrada);
  opcoes = opcoes || {};
  const alertas = [];
  const data = resolverData(dataISO, alertas);
  const overrides = opcoes.overrides || {};
  const salario = lerDinheiroCampo(entrada, 'salario', 'o salário', alertas, { obrigatorio: true });
  const r = inssProgressivo(salario || 0, data, overrides);
  if (r.param.fora_da_vigencia) alertas.push(alertaForaDaVigencia(r.param, data));
  const aliquotaEfetiva = salario ? Math.round((r.valor / salario) * 10000) / 100 : 0;
  return montar({
    entrada,
    resultado: { base: salario || 0, inss: r.valor, teto: r.teto, aliquota_efetiva_pct: aliquotaEfetiva },
    passos: salario ? passosInss(r) : [],
    alertas,
    data,
  });
}
