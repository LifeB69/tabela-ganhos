import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../js/motor/index.js';

test('alerta de piso usa a contração "do piso"', () => {
  const r = m.calcularDomestico({ tipo: 'mensalista', salario: '1621,00', uf: 'SP' }, '2026-11-20');
  const a = r.alertas.find((x) => x.codigo === 'abaixo_piso');
  assert.match(a.texto, /abaixo do piso de SP/);
  assert.doesNotMatch(a.texto, /de o /);
});

test('diarista com 3 dias na mesma casa não afirma "sem direitos"', () => {
  const r = m.calcularDiarista({ valorDiaria: '200,00', diasDaSemana: [1, 3, 5], mes: '2026-11', mesmaResidencia: true }, '2026-11-20');
  const ids = r.passos.map((p) => p.id);
  assert.ok(ids.includes('direitos_dependem'));
  assert.ok(!ids.includes('sem_direitos_clt'));
  const r2 = m.calcularDiarista({ valorDiaria: '200,00', diasDaSemana: [1], mes: '2026-11' }, '2026-11-20');
  assert.ok(r2.passos.some((p) => p.id === 'sem_direitos_clt'));
});

test('alerta de jornada: data editada aparece no texto da liminar; por hora não fala de salário mensal', () => {
  const ov = { jornada_datas: { jornada_42: '2026-12-17', jornada_40: '2027-12-17' } };
  const al = m.alertasMudancaJornada('2027-01-10', ov);
  const lim = al.find((a) => a.codigo === 'jornada_42_liminar');
  assert.match(lim.texto, /17\/12\/2026/);
  const h = m.calcularPorHora({ valorHora: '10,00', horasDia: 4, diasMes: 10 }, '2026-11-20');
  const j = h.alertas.find((a) => a.codigo === 'mudanca_jornada_42');
  assert.ok(j && !/salário mensal não pode/.test(j.texto));
});
