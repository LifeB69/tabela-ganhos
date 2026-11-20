import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularDomestico, vencimentoDae } from '../js/motor/index.js';

const D = '2026-11-20';

test('doméstico mensalista R$ 1.621,00: INSS, líquido, parte patronal e DAE', () => {
  const r = calcularDomestico({ tipo: 'mensalista', salario: '1.621,00' }, D);
  const x = r.resultado;
  assert.equal(x.inss, 12158);
  assert.equal(x.irrf, 0);
  assert.equal(x.liquido, 149942);
  assert.equal(x.encargos.cpp, 12968);
  assert.equal(x.encargos.gilrat, 1297);
  assert.equal(x.encargos.fgts, 12968);
  assert.equal(x.encargos.indenizacao, 5187);
  assert.equal(x.encargos.total, 32420);
  assert.equal(x.dae, 44578);
  assert.equal(x.custo_mensal, 194520);
  assert.equal(x.dae_vencimento, '2026-12-18'); // 20/12/2026 é domingo
  assert.equal(r.parametros_versao, '2026-11-20');
  assert.equal(r.data_referencia, D);
  assert.ok(r.passos.find((p) => p.id === 'inss_total').formula.includes('7,5% × R$ 1.621,00'));
  assert.ok(!r.alertas.some((a) => a.codigo === 'abaixo_minimo'));
});

test('provisões, 13º com INSS separado e custo anual', () => {
  const x = calcularDomestico({ salario: 162100 }, D).resultado;
  assert.equal(x.provisoes.decimo_terceiro, 13508);
  assert.equal(x.provisoes.terco_ferias, 4503);
  assert.equal(x.decimo_terceiro.primeira_parcela, 81050);
  assert.equal(x.decimo_terceiro.inss, 12158);
  assert.equal(x.decimo_terceiro.segunda_parcela, 162100 - 81050 - 12158);
  assert.equal(x.guardar_por_mes, 13508 + 2702 + 4503 + 901);
  // 12 × 1.945,20 + 13º 1.621,00 + 324,20 + 1/3 540,33 + 108,07
  assert.equal(x.custo_anual, 12 * 194520 + 162100 + 32420 + 54033 + 10807);
});

test('salário abaixo do piso de SP gera alerta de risco; RJ usa o mínimo', () => {
  const sp = calcularDomestico({ salario: 162100, uf: 'SP' }, D);
  const a = sp.alertas.find((x) => x.codigo === 'abaixo_piso');
  assert.ok(a);
  assert.equal(a.nivel, 'risco');
  assert.equal(a.valor_referencia, 187436);
  const rj = calcularDomestico({ salario: 162100, uf: 'RJ' }, D);
  assert.ok(!rj.alertas.some((x) => x.codigo === 'abaixo_piso' || x.codigo === 'abaixo_minimo'));
  assert.ok(rj.alertas.some((x) => x.codigo === 'piso_nao_verificado'));
  const pr = calcularDomestico({ salario: 200000, uf: 'PR' }, D);
  assert.equal(pr.resultado.piso_aplicado, 218163);
  assert.ok(pr.alertas.some((x) => x.codigo === 'abaixo_piso'));
});

test('salário abaixo do mínimo', () => {
  const r = calcularDomestico({ salario: 150000 }, D);
  assert.ok(r.alertas.some((a) => a.codigo === 'abaixo_minimo' && a.nivel === 'risco'));
});

test('troca de jornada por data: divisor 220, 210 e 200', () => {
  const antes = calcularDomestico({ salario: 162100 }, '2026-12-15').resultado;
  const depois = calcularDomestico({ salario: 162100 }, '2026-12-16').resultado;
  const em2028 = calcularDomestico({ salario: 162100 }, '2028-01-10').resultado;
  assert.equal(antes.jornada_semanal, 44);
  assert.equal(antes.divisor, 220);
  assert.equal(antes.valor_hora, 737);
  assert.equal(depois.jornada_semanal, 42);
  assert.equal(depois.divisor, 210);
  assert.equal(depois.valor_hora, 772);
  assert.equal(em2028.divisor, 200);
  assert.equal(em2028.valor_hora, 811);
  // salário não muda com a jornada
  assert.equal(depois.inss, antes.inss);
  // data da troca editada
  const ov = calcularDomestico({ salario: 162100 }, '2026-12-16', { overrides: { jornada_datas: { jornada_42: '2026-12-17' } } }).resultado;
  assert.equal(ov.divisor, 220);
});

test('horista: salário = valor/hora × horas semanais × 5 e tempo parcial', () => {
  const r = calcularDomestico({ tipo: 'horista', valorHora: '10', horasSemana: 20 }, D);
  assert.equal(r.resultado.salario, 100000);
  const tp = r.alertas.find((a) => a.codigo === 'tempo_parcial');
  assert.ok(tp);
  assert.equal(tp.dias_ferias, 14);
  assert.equal(r.resultado.provisoes.dias_ferias, 14);
  assert.ok(!r.alertas.some((a) => a.codigo === 'abaixo_minimo'));
  const baixo = calcularDomestico({ tipo: 'horista', valorHora: '7', horasSemana: 20 }, D);
  const a = baixo.alertas.find((x) => x.codigo === 'abaixo_minimo');
  assert.ok(a);
  assert.equal(a.valor_referencia, Math.round((162100 * 20) / 44)); // mínimo proporcional
  // depois de 16/12/2026: × 5 continua (210 ÷ 42)
  assert.equal(calcularDomestico({ tipo: 'horista', valorHora: '10', horasSemana: 20 }, '2026-12-20').resultado.salario, 100000);
});

test('horas extras 50%, domingo/feriado em dobro e adicional noturno', () => {
  const x = calcularDomestico({ salario: 162100, horasExtras: 10, horasDomingoFeriado: 8, horasNoturnas: 7 }, D).resultado;
  assert.equal(x.horas_extras, 11052); // 1.621 ÷ 220 × 1,5 × 10 = 110,5227
  assert.equal(x.domingo_feriado, 11789); // 1.621 ÷ 220 × 2 × 8 = 117,8909
  assert.equal(x.adicional_noturno, 1179); // 7 h × 60/52,5 = 8 h × 7,3682 × 20% = 11,789
  assert.equal(x.bruto, 162100 + 11052 + 11789 + 1179);
  const sem = calcularDomestico({ salario: 162100, horasDomingoFeriado: 8, pagarDobroDomingoFeriado: false }, D).resultado;
  assert.equal(sem.domingo_feriado, 8842); // como extra a 50%
  const h = calcularDomestico({ tipo: 'horista', valorHora: '10', horasSemana: 44, horasNoturnas: 7 }, D).resultado;
  assert.equal(h.hora_noturna_reduzida, 1000); // 1 h a mais × R$ 10
  assert.equal(h.adicional_noturno, 1600); // 8 h × 10 × 20%
});

test('segundo dia de repouso marcado como não verificado após 16/12/2026', () => {
  const r = calcularDomestico({ salario: 162100, horasDomingoFeriado: 8 }, '2026-12-20');
  const a = r.alertas.find((x) => x.codigo === 'segundo_repouso_nao_verificado');
  assert.ok(a);
  assert.equal(a.status, 'nao_verificado');
});

test('vale-transporte: menor entre 6% do salário e o custo do vale', () => {
  const caro = calcularDomestico({ salario: 162100, custoVtMes: '200' }, D).resultado;
  assert.equal(caro.vt_desconto, 9726);
  assert.equal(caro.vt_empregador, 20000 - 9726);
  assert.equal(caro.liquido, 162100 - 12158 - 9726);
  assert.equal(caro.custo_mensal, 162100 + 32420 + 10274);
  const barato = calcularDomestico({ salario: 162100, custoVtMes: '50' }, D).resultado;
  assert.equal(barato.vt_desconto, 5000);
  assert.equal(barato.vt_empregador, 0);
  const recusa = calcularDomestico({ salario: 162100, custoVtMes: '200', recusaVt: true }, D).resultado;
  assert.equal(recusa.vt_desconto, 0);
  const prop = calcularDomestico({ salario: 162100, custoVtMes: '200', diasComVale: 11, diasUteisMes: 22 }, D).resultado;
  assert.equal(prop.vt_desconto, 4863);
});

test('dependentes, IRRF e salário-família entram no líquido e no DAE', () => {
  const alto = calcularDomestico({ salario: 600000, dependentes: 1 }, D).resultado;
  assert.ok(alto.irrf > 0);
  assert.equal(alto.dae, alto.encargos.total + alto.inss + alto.irrf);
  const sf = calcularDomestico({ salario: 162100, filhosSalarioFamilia: 2 }, D).resultado;
  assert.equal(sf.salario_familia, 13508);
  assert.equal(sf.liquido, 149942 + 13508);
  assert.equal(sf.dae, 44578 - 13508);
});

test('divisor contratual menor e divisor editado', () => {
  const r = calcularDomestico({ salario: 162100, horasSemana: 40 }, D).resultado;
  assert.equal(r.divisor, 200);
  const ov = calcularDomestico({ salario: 162100 }, D, { overrides: { divisor_hora: 180 } });
  assert.equal(ov.resultado.divisor, 180);
  assert.ok(ov.alertas.some((a) => a.codigo === 'divisor_editado'));
});

test('vencimento do DAE: dia 20 do mês seguinte, antecipado se não for dia útil', () => {
  assert.equal(vencimentoDae('2026-10-15').vencimento, '2026-11-19'); // 20/11 é feriado nacional
  assert.equal(vencimentoDae('2026-01-31').vencimento, '2026-02-20');
  assert.equal(vencimentoDae('2026-02-10').vencimento, '2026-03-20');
  assert.equal(vencimentoDae('2026-05-10').vencimento, '2026-06-19'); // 20/06/2026 é sábado
});
