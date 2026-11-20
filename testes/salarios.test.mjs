import { test } from 'node:test';
import assert from 'node:assert/strict';
import { converterSalario, tabelaMinimo, tabelaPisos, tabelaComparacao, proximasMudancas } from '../js/motor/index.js';

const D = '2026-11-20';

test('tabela do mínimo: mês, dia, hora e previsto de 2027', () => {
  const r = tabelaMinimo(D).resultado;
  assert.equal(r.mensal, 162100);
  assert.equal(r.diario, 5404);
  assert.equal(r.hora, 737);
  assert.equal(r.divisor, 220);
  assert.equal(r.previstos[0].mensal, 174100);
  assert.equal(r.previstos[0].status, 'previsto');
  const dez = tabelaMinimo('2026-12-16').resultado;
  assert.equal(dez.hora, 772);
  assert.equal(dez.hora_derivada, true);
});

test('tabela de pisos: maior entre piso e mínimo; PR por hora = 9,92', () => {
  const linhas = tabelaPisos(D).resultado.linhas;
  const pr = linhas.find((l) => l.uf === 'PR');
  assert.equal(pr.usado_no_calculo, 218163);
  assert.equal(pr.hora, 992);
  const rj = linhas.find((l) => l.uf === 'RJ');
  assert.equal(rj.status, 'nao_verificado');
  assert.equal(rj.usado_no_calculo, 162100);
  const demais = linhas.find((l) => l.uf === 'demais');
  assert.ok(demais.ufs.includes('MG'));
  assert.equal(linhas.find((l) => l.uf === 'SP').usado_no_calculo, 187436);
  // SP antes da lei de 2026: usa o mínimo
  assert.equal(tabelaPisos('2026-05-01').resultado.linhas.find((l) => l.uf === 'SP').usado_no_calculo, 162100);
});

test('conversor: hora para mês pelo divisor e pelo calendário', () => {
  const legal = converterSalario({ valor: 162100, unidade: 'mes' }, D).resultado;
  assert.equal(legal.hora, 737);
  assert.equal(legal.dia, 5403); // salário-dia = mensal ÷ 30
  assert.equal(legal.horas_mes, 220);
  assert.equal(legal.ano, 1945200);
  assert.equal(legal.ano_com_13_e_ferias, Math.round((162100 * 40) / 3));
  const cal = converterSalario({ valor: 2000, unidade: 'hora', horasDia: 8, diasSemana: 5, metodo: 'calendario' }, D).resultado;
  assert.equal(cal.semana, 80000);
  assert.equal(cal.dia, 16000);
  assert.equal(cal.mes, Math.round((80000 * 52) / 12));
});

test('tabela de comparação com coluna do mínimo', () => {
  const r = tabelaComparacao({ valoresHora: ['12', '7'], horasDia: 4, dias: 10 }, D);
  const cols = r.resultado.colunas;
  assert.equal(cols.length, 3);
  assert.equal(cols[0].total, 48000);
  assert.equal(cols[1].abaixo_minimo, true);
  assert.equal(cols[2].minimo, true);
  assert.equal(cols[2].valor_hora, 737);
  assert.ok(r.alertas.some((a) => a.codigo === 'abaixo_minimo'));
});

test('próximas mudanças', () => {
  const m = proximasMudancas(D, '2026-12-31').resultado.mudancas;
  assert.ok(m.some((x) => x.chave === 'jornada_semanal' && x.valor_novo === 42 && x.valor_atual === 44));
});
