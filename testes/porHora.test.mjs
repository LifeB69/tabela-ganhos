import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularPorHora, calcularPorHoraInverso } from '../js/motor/index.js';

const D = '2026-11-20';

test('4 h × 10 dias × R$ 12 = R$ 480', () => {
  const r = calcularPorHora({ valorHora: '12', horasDia: 4, dias: 10 }, D);
  assert.equal(r.resultado.total, 48000);
  assert.equal(r.resultado.valor_dia, 4800);
  assert.equal(r.resultado.horas_mes, 40);
  assert.ok(!r.alertas.some((a) => a.codigo === 'abaixo_minimo'));
  assert.ok(r.passos.some((p) => p.id === 'total' && /480,00/.test(p.formula)));
});

test('alerta de mínimo para R$ 7,00 por hora', () => {
  const r = calcularPorHora({ valorHora: '7,00', horasDia: 4, dias: 10 }, D);
  const a = r.alertas.find((x) => x.codigo === 'abaixo_minimo');
  assert.ok(a);
  assert.equal(a.valor_referencia, 737);
  assert.ok(a.fonte_url);
  assert.equal(calcularPorHora({ valorHora: '7,37', horasDia: 4, dias: 10 }, D).alertas.some((x) => x.codigo === 'abaixo_minimo'), false);
});

test('alerta de piso estadual por hora (SP)', () => {
  const r = calcularPorHora({ valorHora: '8,00', horasDia: 4, dias: 10, uf: 'SP' }, D);
  const a = r.alertas.find((x) => x.codigo === 'abaixo_piso');
  assert.ok(a);
  assert.equal(a.valor_referencia, 852); // 1.874,36 ÷ 220
});

test('dias por semana × semanas, e média 52/12', () => {
  const a = calcularPorHora({ valorHora: 2000, horasDia: 4, diasSemana: 2, semanas: 4 }, D);
  assert.equal(a.resultado.total, 2000 * 4 * 8);
  const b = calcularPorHora({ valorHora: 2000, horasDia: 4, diasSemana: 2 }, D);
  assert.equal(b.resultado.total, Math.round((2000 * 4 * 2 * 52) / 12)); // 69.333,33 centavos -> R$ 693,33
});

test('mínimo por hora muda com o divisor depois de 16/12/2026', () => {
  const r = calcularPorHora({ valorHora: '7,50', horasDia: 4, dias: 10 }, '2026-12-16');
  const a = r.alertas.find((x) => x.codigo === 'abaixo_minimo');
  assert.ok(a, 'R$ 7,50 fica abaixo de 1.621 ÷ 210 = 7,72');
  assert.equal(a.valor_referencia, 772);
  assert.ok(r.alertas.some((x) => x.codigo === 'minimo_hora_derivado'));
});

test('aviso de mudança de jornada próxima', () => {
  const r = calcularPorHora({ valorHora: 2000, horasDia: 4, dias: 10 }, D);
  const a = r.alertas.find((x) => x.codigo === 'mudanca_jornada_42');
  assert.ok(a);
  assert.equal(a.nivel, 'info');
  assert.equal(a.data_mudanca, '2026-12-16');
  const depois = calcularPorHora({ valorHora: 2000, horasDia: 4, dias: 10 }, '2027-01-10');
  assert.ok(depois.alertas.some((x) => x.codigo === 'jornada_42_liminar'));
});

test('modo inverso: do orçamento para horas e dias', () => {
  const r = calcularPorHoraInverso({ orcamento: '500', valorHora: '12', dias: 10, horasDia: 4 }, D).resultado;
  assert.equal(r.horas, 41.66);
  assert.equal(r.horas_por_dia, 4.16);
  assert.equal(r.dias_inteiros, 10);
  assert.equal(r.sobra, 2000);
});
