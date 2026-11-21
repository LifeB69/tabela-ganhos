import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularInss, calcularIrrf, inssProgressivo } from '../js/motor/index.js';

const D = '2026-11-20';
const inss = (s) => calcularInss({ salario: s }, D).resultado.inss;

test('INSS: limites de cada faixa e teto', () => {
  assert.equal(inss(162100), 12158); // 7,5% × 1.621,00 = 121,575
  assert.equal(inss(162101), 12158);
  assert.equal(inss(290284), 23694); // 121,575 + 115,3656
  assert.equal(inss(435427), 41111); // + 174,1716
  assert.equal(inss(847555), 98809); // desconto máximo R$ 988,09
  assert.equal(inss(1000000), 98809); // acima do teto
  assert.equal(inss(100000), 7500);
  assert.equal(inss(0), 0);
});

test('INSS: passos mostram as faixas e a fonte', () => {
  const r = calcularInss({ salario: '3.000,00' }, D);
  assert.equal(r.resultado.inss, 24860); // 236,9406 + 97,16 × 12% = 248,5998
  assert.ok(r.passos.length >= 4);
  assert.ok(r.passos.every((p) => p.fonte_url));
  assert.match(r.passos[0].formula, /7,5%/);
});

test('INSS progressivo confere com a fórmula da parcela a deduzir', () => {
  // S × alíquota − parcela: 9% − 24,31; 12% − 111,40; 14% − 198,49 (diferença máxima de 1 centavo)
  for (const [s, aliq, ded] of [[200000, 9, 2431], [400000, 12, 11140], [600000, 14, 19849]]) {
    const formula = Math.round((s * aliq) / 100 - ded);
    assert.ok(Math.abs(inssProgressivo(s, D).valor - formula) <= 1, `${s}`);
  }
});

test('IRRF: R$ 5.000 => zero (redutor; o simplificado é o melhor)', () => {
  const r = calcularIrrf({ rendimento: '5.000,00' }, D).resultado;
  assert.equal(r.irrf, 0);
  assert.equal(r.opcao, 'simplificado');
  assert.equal(r.imposto_antes_reducao, 31289);
  assert.equal(r.reducao, 31289);
  assert.equal(r.irrf_legal, 2378); // com deduções legais sobraria R$ 23,78
});

test('IRRF: R$ 6.000 => com redutor', () => {
  const r = calcularIrrf({ rendimento: 600000 }, D).resultado;
  assert.equal(r.inss, 64151);
  assert.equal(r.base, 535849);
  assert.equal(r.imposto_antes_reducao, 56485); // 27,5% × 5.358,49 − 908,73
  assert.equal(r.reducao, 17975); // 978,62 − 0,133145 × 6.000
  assert.equal(r.irrf, 38510);
  assert.equal(r.opcao, 'legal');
});

test('IRRF: R$ 8.000 => sem redutor', () => {
  const r = calcularIrrf({ rendimento: 800000 }, D).resultado;
  assert.equal(r.inss, 92151);
  assert.equal(r.reducao, 0);
  assert.equal(r.irrf, 103785); // 27,5% × 7.078,49 − 908,73
});

test('IRRF: dependentes reduzem a base', () => {
  const sem = calcularIrrf({ rendimento: 800000 }, D).resultado;
  const com = calcularIrrf({ rendimento: 800000, dependentes: 2 }, D).resultado;
  assert.equal(com.base, sem.base - 2 * 18959);
  assert.equal(com.irrf, 93358); // 27,5% × 6.699,31 − 908,73 = 933,58025
});

test('IRRF: escolhe o desconto simplificado quando é melhor', () => {
  // R$ 5.500: INSS 571,51 < desconto simplificado 607,20
  const r = calcularIrrf({ rendimento: 550000 }, D).resultado;
  assert.equal(r.inss, 57151);
  assert.equal(r.opcao, 'simplificado');
  assert.ok(r.irrf_simplificado < r.irrf_legal);
  assert.equal(r.base, 550000 - 60720);
  assert.equal(calcularIrrf({ rendimento: 400000 }, D).resultado.irrf, 0); // até R$ 5.000 zera
  const alto = calcularIrrf({ rendimento: 1000000, inss: 0 }, D).resultado; // sem INSS informado como 0
  assert.equal(alto.opcao, 'simplificado');
});

test('IRRF: faixa de transição do redutor (R$ 7.000, R$ 7.350 e R$ 7.350,01)', () => {
  assert.equal(calcularIrrf({ rendimento: 700000 }, D).resultado.reducao, 4661); // 978,62 − 932,015 = 46,605
  const a = calcularIrrf({ rendimento: 735000 }, D).resultado;
  assert.equal(a.reducao, 0); // 978,62 − 978,61575 = 0,00425 -> R$ 0,00
  const b = calcularIrrf({ rendimento: 735001 }, D).resultado;
  assert.equal(b.reducao, 0);
});
