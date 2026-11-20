import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../js/motor/index.js';

const FUNCOES = [
  M.calcularInss, M.calcularIrrf, M.calcularPorHora, M.calcularPorHoraInverso,
  M.calcularDiarista, M.calcularDomestico, M.converterSalario, M.tabelaComparacao,
];

function conferirEnvelope(r) {
  for (const k of ['entrada', 'resultado', 'passos', 'alertas', 'parametros_versao', 'data_referencia']) assert.ok(k in r, k);
  assert.ok(Array.isArray(r.passos));
  assert.ok(Array.isArray(r.alertas));
  for (const p of r.passos) {
    for (const k of ['id', 'rotulo', 'formula', 'valor', 'fonte_url', 'lei']) assert.ok(k in p, `passo.${k}`);
    assert.ok(p.valor === null || Number.isInteger(p.valor), `passo ${p.id} em centavos inteiros`);
  }
  for (const a of r.alertas) {
    assert.ok(['info', 'atencao', 'risco'].includes(a.nivel), a.codigo);
    for (const k of ['codigo', 'titulo', 'texto', 'fonte_url']) assert.ok(k in a, `alerta.${k}`);
  }
}

test('entrada vazia não lança erro e devolve alertas de validação', () => {
  for (const f of FUNCOES) {
    for (const entrada of [undefined, {}, { salario: 'abc', valorHora: '', horasDia: 'x' }]) {
      const r = f(entrada, undefined);
      conferirEnvelope(r);
      assert.ok(r.alertas.some((a) => a.codigo === 'data_invalida'), `${f.name} sem data`);
      assert.ok(r.alertas.some((a) => a.codigo === 'entrada_invalida'), `${f.name} valida entrada`);
    }
  }
});

test('envelope completo nas funções com entrada válida', () => {
  const D = '2026-11-20';
  conferirEnvelope(M.calcularDomestico({ salario: 300000, uf: 'SP', custoVtMes: 20000, horasExtras: 5, horasNoturnas: 10, dependentes: 1 }, D));
  conferirEnvelope(M.calcularDiarista({ valorDiaria: 20000, diasDaSemana: [1, 3, 5] }, D));
  conferirEnvelope(M.calcularPorHora({ valorHora: 1500, horasDia: 6, diasSemana: 3 }, D));
  conferirEnvelope(M.tabelaMinimo(D));
  conferirEnvelope(M.tabelaPisos(D));
});

test('resultado em centavos inteiros', () => {
  const r = M.calcularDomestico({ salario: '2.345,67', horasExtras: 3.5, horasNoturnas: 4.25, custoVtMes: '180,40' }, '2026-11-20').resultado;
  const conferir = (o, ctx) => {
    for (const [k, v] of Object.entries(o)) {
      if (v && typeof v === 'object') conferir(v, `${ctx}.${k}`);
      else if (typeof v === 'number' && !['jornada_semanal', 'divisor', 'dias_ferias'].includes(k)) assert.ok(Number.isInteger(v), `${ctx}.${k} = ${v}`);
    }
  };
  conferir(r, 'resultado');
});

test('data antes de 2026 usa a tabela mais próxima e avisa', () => {
  const r = M.calcularDomestico({ salario: 162100 }, '2025-06-10');
  assert.ok(r.alertas.some((a) => a.codigo === 'fora_da_vigencia'));
  assert.equal(r.resultado.inss, 12158);
});

test('data no formato AAAA-MM é aceita', () => {
  const r = M.calcularPorHora({ valorHora: 1200, horasDia: 4, dias: 10 }, '2026-11');
  assert.equal(r.data_referencia, '2026-11-01');
});
