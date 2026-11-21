// IRRF mensal com a escolha entre deduções legais e desconto simplificado, e o redutor da Lei 15.270/2025.
import { getParamComReserva } from './parametros.js';
import { pctParaMilionesimos, dividirArredondando, formatarBRL, formatarPct } from './dinheiro.js';
import { montar, passo, resolverData, lerDinheiroCampo, lerNumeroCampo, normalizarEntrada } from './comum.js';
import { inssProgressivo } from './inss.js';
import { alertaForaDaVigencia } from './jornada.js';

function impostoPelaTabela(base, tabela) {
  const faixa = tabela.faixas.find((f) => f.ate === null || base <= f.ate);
  if (!faixa || faixa.aliquota_pct === 0 || base <= 0) return { imposto: 0, faixa };
  const num = base * pctParaMilionesimos(faixa.aliquota_pct) - faixa.deducao * 1000000;
  return { imposto: Math.max(0, dividirArredondando(num, 1000000)), faixa };
}

/** Redução da Lei 15.270/2025 sobre o rendimento BRUTO tributável (nunca maior que o imposto). */
export function reducaoLei15270(brutoTributavel, imposto, redutor) {
  if (imposto <= 0) return 0;
  const r = redutor;
  if (brutoTributavel <= r.limite_reducao_total) return Math.min(imposto, r.reducao_maxima);
  if (brutoTributavel <= r.limite_superior) {
    const red = dividirArredondando(r.constante * 1000000 - brutoTributavel * r.fator_milionesimos, 1000000);
    return Math.max(0, Math.min(imposto, red));
  }
  return 0;
}

/**
 * Núcleo do IRRF mensal.
 * brutoTributavel e inss em centavos. Devolve as duas opções e a escolhida (a de menor imposto final).
 */
export function irrfMensal(brutoTributavel, inss, dependentes, dataISO, overrides = {}, opcoes = {}) {
  const pTabela = getParamComReserva('irrf_mensal', dataISO, overrides);
  const pRedutor = getParamComReserva('irrf_redutor', dataISO, overrides);
  const t = pTabela.valor;
  const usarRedutor = opcoes.aplicarRedutor !== false;
  const permitirSimplificado = opcoes.permitirSimplificado !== false;
  const outras = Math.max(0, Math.round(opcoes.outrasDeducoes || 0));
  const dep = Math.max(0, Math.floor(dependentes || 0));

  const calcOpcao = (tipo, deducoes) => {
    const base = Math.max(0, brutoTributavel - deducoes);
    const { imposto, faixa } = impostoPelaTabela(base, t);
    const reducao = usarRedutor ? reducaoLei15270(brutoTributavel, imposto, pRedutor.valor) : 0;
    return { tipo, deducoes, base, faixa, imposto, reducao, final: imposto - reducao };
  };
  const legal = calcOpcao('legal', inss + dep * t.dependente + outras);
  const simplificado = permitirSimplificado ? calcOpcao('simplificado', t.desconto_simplificado) : null;
  const escolhida = simplificado && simplificado.final < legal.final ? simplificado : legal;
  return { valor: escolhida.final, escolhida, legal, simplificado, dependentes: dep, params: { tabela: pTabela, redutor: pRedutor } };
}

/** Passos de "mostrar a conta" do IRRF. */
export function passosIrrf(r, brutoTributavel, prefixo = 'irrf', rotulo = 'IRRF') {
  const { tabela, redutor } = r.params;
  const t = tabela.valor;
  const passos = [];
  const desc = (o) => {
    if (o.tipo === 'simplificado') return `${formatarBRL(brutoTributavel)} − desconto simplificado ${formatarBRL(t.desconto_simplificado)}`;
    const partes = [`${formatarBRL(brutoTributavel)} − INSS e deduções`];
    if (r.dependentes) partes.push(`(inclui ${r.dependentes} × ${formatarBRL(t.dependente)} por dependente)`);
    return partes.join(' ');
  };
  const linhaOpcao = (o) => {
    const aliq = o.faixa && o.faixa.aliquota_pct ? `${formatarPct(o.faixa.aliquota_pct)} × ${formatarBRL(o.base)} − ${formatarBRL(o.faixa.deducao)}` : 'faixa isenta';
    return `Base: ${desc(o)} = ${formatarBRL(o.base)}; imposto: ${aliq} = ${formatarBRL(o.imposto)}; redução Lei 15.270: ${formatarBRL(o.reducao)}; final ${formatarBRL(o.final)}`;
  };
  passos.push(passo(`${prefixo}_legal`, `${rotulo} com deduções legais`, linhaOpcao(r.legal), r.legal.final, tabela));
  if (r.simplificado) {
    passos.push(passo(`${prefixo}_simplificado`, `${rotulo} com desconto simplificado`, linhaOpcao(r.simplificado), r.simplificado.final, tabela));
  }
  if (r.escolhida.reducao > 0) {
    const f = brutoTributavel <= redutor.valor.limite_reducao_total
      ? `Rendimento até ${formatarBRL(redutor.valor.limite_reducao_total)}: redução de até ${formatarBRL(redutor.valor.reducao_maxima)}, limitada ao imposto = ${formatarBRL(r.escolhida.reducao)}`
      : `R$ 978,62 − 0,133145 × ${formatarBRL(brutoTributavel)} (rendimento bruto tributável) = ${formatarBRL(r.escolhida.reducao)}`;
    passos.push(passo(`${prefixo}_redutor`, 'Redução do IR (Lei 15.270/2025)', f, r.escolhida.reducao, redutor));
  }
  passos.push(passo(`${prefixo}_total`, rotulo,
    `Menor imposto entre as opções: ${r.escolhida.tipo === 'simplificado' ? 'desconto simplificado' : 'deduções legais'} = ${formatarBRL(r.valor)}`,
    r.valor, tabela));
  return passos;
}

/**
 * calcularIrrf({ rendimento, inss?, dependentes?, outrasDeducoes? }, dataISO, { overrides })
 * Se 'inss' não vier, é calculado pela tabela do empregado sobre o rendimento.
 */
export function calcularIrrf(entrada = {}, dataISO, opcoes = {}) {
  entrada = normalizarEntrada(entrada);
  opcoes = opcoes || {};
  const alertas = [];
  const data = resolverData(dataISO, alertas);
  const overrides = opcoes.overrides || {};
  const rendimento = lerDinheiroCampo(entrada, 'rendimento', 'o rendimento tributável', alertas, { obrigatorio: true }) || 0;
  let inss = lerDinheiroCampo(entrada, 'inss', 'o INSS', alertas);
  const passos = [];
  if (inss === null) {
    const ri = inssProgressivo(rendimento, data, overrides);
    inss = ri.valor;
    passos.push(passo('inss', 'INSS do empregado (calculado)', `Tabela progressiva sobre ${formatarBRL(rendimento)} = ${formatarBRL(inss)}`, inss, ri.param));
  }
  const dependentes = lerNumeroCampo(entrada, 'dependentes', 'dependentes', alertas, { min: 0, max: 50 }) || 0;
  const outrasDeducoes = lerDinheiroCampo(entrada, 'outrasDeducoes', 'outras deduções', alertas) || 0;
  const r = irrfMensal(rendimento, inss, dependentes, data, overrides, { outrasDeducoes });
  if (r.params.tabela.fora_da_vigencia) alertas.push(alertaForaDaVigencia(r.params.tabela, data));
  passos.push(...passosIrrf(r, rendimento));
  return montar({
    entrada,
    resultado: {
      rendimento,
      inss,
      irrf: r.valor,
      opcao: r.escolhida.tipo,
      base: r.escolhida.base,
      imposto_antes_reducao: r.escolhida.imposto,
      reducao: r.escolhida.reducao,
      irrf_legal: r.legal.final,
      irrf_simplificado: r.simplificado ? r.simplificado.final : null,
    },
    passos,
    alertas,
    data,
  });
}
