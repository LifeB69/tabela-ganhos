import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularDiarista, contarDiasDaSemanaNoMes } from '../js/motor/index.js';

const D = '2026-11-20';

test('conta os dias reais da semana no mês (terças e quintas de nov/2026)', () => {
  const c = contarDiasDaSemanaNoMes('2026-11', [2, 4]);
  assert.equal(c.porDia[2], 4); // 3, 10, 17, 24
  assert.equal(c.porDia[4], 4); // 5, 12, 19, 26
  assert.equal(c.total, 8);
  assert.equal(contarDiasDaSemanaNoMes('2026-12', [2]).total, 5); // 1, 8, 15, 22, 29
});

test('diarista 2 dias: custo do mês real e médio, sem alerta de risco', () => {
  const r = calcularDiarista({ valorDiaria: '200', diasDaSemana: [2, 4], mesmaResidencia: true, mes: '2026-11' }, D);
  assert.equal(r.resultado.custo_mes, 160000);
  assert.equal(r.resultado.custo_mes_media, Math.round((20000 * 2 * 52) / 12));
  assert.equal(r.resultado.tem_13, false);
  assert.ok(!r.alertas.some((a) => a.nivel === 'risco'));
  assert.ok(r.alertas.some((a) => a.codigo === 'vinculo_limite'));
  const exp = r.passos.find((p) => p.id === 'sem_direitos_clt');
  assert.ok(exp && /mais de 2 dias por semana/.test(exp.formula) && exp.fonte_url);
});

test('diarista 3 dias por semana na mesma casa => alerta de risco cauteloso', () => {
  const r = calcularDiarista({ valorDiaria: '200', diasSemana: 3, mesmaResidencia: true }, D);
  const a = r.alertas.find((x) => x.codigo === 'vinculo_domestico');
  assert.ok(a);
  assert.equal(a.nivel, 'risco');
  assert.equal(a.titulo, 'Pode ser emprego doméstico');
  assert.match(a.texto, /pode ser emprego doméstico/);
  assert.match(a.fonte_url, /lcp150/);
  assert.equal(a.lei, 'LC 150, art. 1º');
});

test('3 dias em casas diferentes não gera risco de vínculo doméstico', () => {
  const r = calcularDiarista({ valorDiaria: '200', diasSemana: 3, mesmaResidencia: false }, D);
  assert.ok(!r.alertas.some((a) => a.codigo === 'vinculo_domestico'));
});

test('diária por hora e contribuições da diarista (só informação)', () => {
  const r = calcularDiarista({ valorHora: '25', horasDia: 8, diasSemana: 1 }, D);
  assert.equal(r.resultado.valor_diaria, 20000);
  assert.equal(r.resultado.contribuicoes_diarista.inss_simplificado_11, 17831);
  assert.equal(r.resultado.contribuicoes_diarista.mei_das_inss, 8105);
  assert.equal(r.resultado.contribuicoes_diarista.mei_das_com_iss, 8605);
  assert.equal(r.resultado.contribuicoes_diarista.inss_normal_20, 32420); // renda média < mínimo: base mínima
});

test('diária abaixo do mínimo por dia gera alerta de referência', () => {
  const r = calcularDiarista({ valorDiaria: '50', diasSemana: 1 }, D);
  assert.ok(r.alertas.some((a) => a.codigo === 'abaixo_minimo'));
});
