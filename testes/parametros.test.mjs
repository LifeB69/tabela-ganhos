import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PARAMETROS, PARAMETROS_VERSAO, DATA_CONFERENCIA, getParam, listarMudancasFuturas, dataValida, obterJornada, obterMinimo,
} from '../js/motor/index.js';

test('versão e data de conferência', () => {
  assert.equal(PARAMETROS_VERSAO, '2026-11-20');
  assert.ok(dataValida(DATA_CONFERENCIA));
});

test('dados: nenhum parâmetro vigente sem fonte_url e vigente_desde', () => {
  const STATUS = new Set(['vigente', 'previsto', 'nao_verificado']);
  for (const p of PARAMETROS) {
    assert.ok(p.chave && p.rotulo && p.unidade, `metadados de ${p.chave}`);
    assert.ok(Array.isArray(p.vigencias) && p.vigencias.length, `vigências de ${p.chave}`);
    for (const v of p.vigencias) {
      assert.ok(STATUS.has(v.status), `status de ${p.chave}`);
      assert.ok(dataValida(v.vigente_desde), `vigente_desde de ${p.chave}`);
      assert.ok(v.vigente_ate === null || (dataValida(v.vigente_ate) && v.vigente_ate >= v.vigente_desde), `vigente_ate de ${p.chave}`);
      assert.ok('valor' in v && v.valor !== undefined, `valor de ${p.chave}`);
      assert.ok(typeof v.lei === 'string' && v.lei.length, `lei de ${p.chave}`);
      if (v.status !== 'nao_verificado') {
        assert.match(String(v.fonte_url), /^https:\/\//, `fonte_url de ${p.chave}`);
      }
    }
  }
});

test('dados: vigências oficiais do mesmo parâmetro não se sobrepõem', () => {
  for (const p of PARAMETROS) {
    const vig = p.vigencias.filter((v) => v.status === 'vigente').sort((a, b) => a.vigente_desde.localeCompare(b.vigente_desde));
    for (let i = 0; i < vig.length - 1; i++) {
      assert.ok(vig[i].vigente_ate !== null && vig[i].vigente_ate < vig[i + 1].vigente_desde, `sobreposição em ${p.chave}`);
    }
  }
});

test('dados: dinheiro em centavos inteiros', () => {
  const verificar = (x, ctx) => {
    if (typeof x === 'number') assert.ok(Number.isInteger(x), `${ctx} = ${x}`);
    else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) if (!k.endsWith('_pct') && k !== 'ate_horas') verificar(v, `${ctx}.${k}`);
  };
  for (const p of PARAMETROS.filter((x) => x.unidade === 'centavos')) for (const v of p.vigencias) verificar(v.valor, p.chave);
});

test('vigências: data antes e depois da troca', () => {
  assert.equal(getParam('jornada_semanal', '2026-12-15').valor, 44);
  assert.equal(getParam('jornada_semanal', '2026-12-16').valor, 42);
  assert.equal(getParam('jornada_semanal', '2027-12-15').valor, 42);
  assert.equal(getParam('jornada_semanal', '2027-12-16').valor, 40);
  assert.equal(getParam('divisor_hora', '2026-12-15').valor, 220);
  assert.equal(getParam('divisor_hora', '2026-12-16').valor, 210);
  assert.equal(getParam('divisor_hora', '2027-12-16').valor, 200);
  assert.equal(getParam('repouso_semanal_dias', '2026-12-16').valor, 2);
  assert.equal(getParam('salario_minimo', '2025-12-31'), null);
  assert.equal(getParam('salario_minimo', '2026-01-01').valor.mensal, 162100);
  assert.equal(getParam('piso_domestico_SP', '2026-05-31'), null);
  assert.equal(getParam('piso_domestico_SP', '2026-06-01').valor, 187436);
  assert.equal(getParam('piso_domestico_PR', '2027-01-01'), null);
});

test('previsto e não verificado não entram no cálculo por padrão', () => {
  assert.equal(getParam('salario_minimo', '2027-03-01').valor.mensal, 162100);
  assert.equal(getParam('salario_minimo', '2027-03-01', {}, { incluirPrevistos: true }).valor.mensal, 174100);
  assert.equal(getParam('piso_domestico_RJ', '2026-11-20'), null);
  assert.equal(getParam('piso_domestico_RJ', '2026-11-20', {}, { incluirNaoVerificados: true }).status, 'nao_verificado');
  assert.equal(getParam('mei_limite_anual', '2027-06-01'), null);
  assert.equal(getParam('mei_limite_anual', '2026-06-01').valor, 8100000);
  const m = obterMinimo('2027-03-01');
  assert.equal(m.mensal, 162100);
  assert.ok(m.alertas.some((a) => a.codigo === 'minimo_previsto'));
});

test('overrides: valor editado e data da troca de jornada', () => {
  const p = getParam('jornada_semanal', '2026-12-20', { jornada_semanal: 44 });
  assert.equal(p.valor, 44);
  assert.equal(p.editado_por_usuario, true);
  const ov = { jornada_datas: { jornada_42: '2026-12-17' } };
  assert.equal(getParam('jornada_semanal', '2026-12-16', ov).valor, 44);
  assert.equal(getParam('jornada_semanal', '2026-12-17', ov).valor, 42);
  assert.equal(getParam('divisor_hora', '2026-12-16', ov).valor, 220);
  assert.equal(getParam('divisor_hora', '2026-12-17', ov).valor, 210);
});

test('divisor: só aceita divisor menor (mais favorável)', () => {
  const a = obterJornada('2026-11-20', { divisor_hora: 200 });
  assert.equal(a.divisor, 200);
  assert.ok(a.alertas.some((x) => x.codigo === 'divisor_editado'));
  const b = obterJornada('2026-11-20', { divisor_hora: 230 });
  assert.equal(b.divisor, 220);
  assert.ok(b.alertas.some((x) => x.codigo === 'divisor_maior_ignorado'));
});

test('mudanças futuras listadas em ordem', () => {
  const m = listarMudancasFuturas('2026-11-20');
  const chaves = m.map((x) => `${x.vigente_desde} ${x.chave}`);
  assert.ok(chaves.includes('2026-12-16 jornada_semanal'));
  assert.ok(chaves.includes('2026-12-16 divisor_hora'));
  assert.ok(chaves.includes('2027-01-01 salario_minimo'));
  assert.ok(chaves.includes('2027-12-16 jornada_semanal'));
  const minimo = m.find((x) => x.chave === 'salario_minimo');
  assert.equal(minimo.status, 'previsto');
  assert.deepEqual(m.map((x) => x.vigente_desde), m.map((x) => x.vigente_desde).slice().sort());
  assert.equal(listarMudancasFuturas('2026-11-20', '2026-12-31').some((x) => x.vigente_desde > '2026-12-31'), false);
});
