// Testes dos problemas apontados na revisão do motor (20/11/2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../js/motor/index.js';

const D = '2026-11-20';
const passoDe = (r, id) => r.passos.find((p) => p.id === id);

test('INSS: cada faixa do "mostrar a conta" sai em reais, não em centavos', () => {
  const r = M.calcularDomestico({ salario: 300000 }, D);
  assert.match(passoDe(r, 'inss_faixa_1').formula, /= R\$ 121,5750$/);
  assert.match(passoDe(r, 'inss_faixa_2').formula, /= R\$ 115,3656$/);
  // 12% × (3.000,00 − 2.902,84) = 11,6592
  assert.match(passoDe(r, 'inss_faixa_3').formula, /= R\$ 11,6592$/);
  const i = M.calcularInss({ salario: 300000 }, D);
  assert.match(passoDe(i, 'inss_faixa_1').formula, /R\$ 121,5750/);
  assert.equal(i.resultado.inss, 24860); // 121,575 + 115,3656 + 11,6592 = 248,5998 -> 248,60
});

test('CPP e GILRAT do doméstico até o teto do INSS; FGTS e 3,2% sobre a remuneração inteira', () => {
  const r = M.calcularDomestico({ salario: 900000 }, D);
  const x = r.resultado;
  assert.equal(x.encargos.cpp, 67804); // 8% × 8.475,55 = 678,044
  assert.equal(x.encargos.gilrat, 6780); // 0,8% × 8.475,55 = 67,8044
  assert.equal(x.encargos.fgts, 72000);
  assert.equal(x.encargos.indenizacao, 28800);
  assert.equal(x.encargos.total, 67804 + 6780 + 72000 + 28800);
  assert.equal(x.dae, x.encargos.total + x.inss + x.irrf);
  assert.match(passoDe(r, 'cpp').formula, /R\$ 8\.475,55/);
  // 13º: teto próprio; provisões e custo anual com a mesma regra
  assert.equal(x.decimo_terceiro.encargos, x.encargos.total);
  assert.equal(x.provisoes.encargos_decimo_terceiro, Math.round(x.encargos.total / 12));
  // 1/3 de férias (3.000,00): o mês de férias já passa do teto, só FGTS e 3,2% crescem: 11,2% × 3.000 = 336,00
  assert.equal(x.provisoes.encargos_terco_ferias, 2800);
  assert.equal(x.custo_anual, 12 * (900000 + x.encargos.total) + 900000 + x.encargos.total + 300000 + 33600);
  // abaixo do teto nada muda
  const b = M.calcularDomestico({ salario: 162100 }, D).resultado;
  assert.equal(b.encargos.total, 32420);
});

test('mínimo por hora derivado: atribuído como conta do app, e nível info sem vínculo', () => {
  const r = M.calcularPorHora({ valorHora: 750, horasDia: 4, dias: 10 }, '2026-12-20');
  const der = r.alertas.find((a) => a.codigo === 'minimo_hora_derivado');
  assert.ok(der);
  assert.match(der.texto, /^Conta do app: R\$ 1\.621,00 ÷ 210/);
  assert.match(der.texto, /R\$ 7,37 por hora/);
  assert.doesNotMatch(der.texto, /o mínimo por hora é o mensal dividido/);
  const ab = r.alertas.find((a) => a.codigo === 'abaixo_minimo');
  assert.equal(ab.nivel, 'info');
  assert.match(ab.titulo, /referência do mínimo mensal proporcional/);
  assert.match(ab.texto, /conta do app/);
  assert.doesNotMatch(ab.texto, /abaixo do mínimo de/);
  const di = M.calcularDiarista({ valorHora: 600, horasDia: 8, diasSemana: 1 }, D);
  assert.equal(di.alertas.find((a) => a.codigo === 'abaixo_minimo').nivel, 'info');
  // doméstico (com vínculo) continua como risco
  const dom = M.calcularDomestico({ tipo: 'horista', valorHora: '7', horasSemana: 20 }, D);
  assert.equal(dom.alertas.find((a) => a.codigo === 'abaixo_minimo').nivel, 'risco');
});

test('salário-família: dedução no DAE limitada às contribuições; o resto é reembolso', () => {
  const r = M.calcularDomestico({ salario: 162100, filhosSalarioFamilia: 4 }, D);
  const x = r.resultado;
  assert.equal(x.salario_familia, 27016); // 4 × 67,54
  assert.equal(x.salario_familia_deduzido, 12158 + 12968 + 1297); // 264,23
  assert.equal(x.salario_familia_reembolso, 593); // 5,93
  assert.equal(x.dae, 32420 + 12158 - 26423);
  assert.equal(x.liquido, 149942 + 27016); // o empregado recebe tudo
  assert.ok(r.alertas.some((a) => a.codigo === 'salario_familia_reembolso'));
  // dentro do limite, nada muda
  const d = M.calcularDomestico({ salario: 162100, filhosSalarioFamilia: 2 }, D).resultado;
  assert.equal(d.salario_familia_reembolso, 0);
  assert.equal(d.dae, 44578 - 13508);
});

test('mensalista com horas noturnas recebe aviso de que a hora reduzida não entrou', () => {
  const r = M.calcularDomestico({ salario: 300000, horasNoturnas: 20 }, D);
  const a = r.alertas.find((x) => x.codigo === 'hora_reduzida_mensalista');
  assert.ok(a);
  assert.equal(a.nivel, 'info');
  assert.match(a.texto, /22,86 h/);
  assert.equal(r.resultado.hora_noturna_reduzida, 0);
  const h = M.calcularDomestico({ tipo: 'horista', valorHora: '10', horasSemana: 44, horasNoturnas: 7 }, D);
  assert.ok(!h.alertas.some((x) => x.codigo === 'hora_reduzida_mensalista'));
});

test('valor com muitos dígitos é recusado com alerta, sem Infinity nem erro', () => {
  const grande = '9'.repeat(400);
  assert.equal(M.parseDinheiro(grande), null);
  assert.equal(M.lerCentavos(1e300), null);
  for (const [f, e] of [
    [M.calcularDomestico, { salario: grande }],
    [M.calcularPorHora, { valorHora: grande, horasDia: 4, dias: 10 }],
    [M.calcularInss, { salario: grande }],
    [M.calcularInss, { salario: 1e300 }],
    [M.calcularDiarista, { valorDiaria: grande, diasSemana: 2 }],
    [M.calcularDomestico, { salario: '2.000.000.000,00' }], // acima de R$ 1 bilhão
  ]) {
    const r = f(e, D);
    assert.ok(r.alertas.some((a) => a.codigo === 'entrada_invalida'), f.name);
    for (const v of Object.values(r.resultado)) if (typeof v === 'number') assert.ok(Number.isFinite(v), f.name);
  }
  // horas com 400 dígitos também
  const h = M.calcularPorHora({ valorHora: 1000, horasDia: grande, dias: 1 }, D);
  assert.ok(h.alertas.some((a) => a.codigo === 'entrada_invalida' && a.campo === 'horasDia'));
});

test('horas por semana muito pequenas não dividem por zero', () => {
  for (const hs of [0.0009, 0.01, 0]) {
    const r = M.calcularDomestico({ salario: 162100, horasSemana: hs }, D);
    assert.ok(r.alertas.some((a) => a.codigo === 'entrada_invalida' && a.campo === 'horasSemana'), String(hs));
    assert.equal(r.resultado.valor_hora, 737);
  }
  assert.equal(M.calcularDomestico({ salario: 162100, horasSemana: 1 }, D).resultado.divisor, 5);
});

test('diarista com dias por semana fracionários: conta exata em centavos inteiros', () => {
  const r = M.calcularDiarista({ valorDiaria: 15000, diasSemana: 2.3 }, D).resultado;
  assert.equal(r.custo_mes_media, 149500); // 150 × 2,3 × 52 ÷ 12
  assert.equal(r.custo_ano_media, 1794000);
  assert.ok(Number.isInteger(r.custo_ano_media));
  const meio = M.calcularDiarista({ valorDiaria: 20000, diasSemana: 0.5 }, D).resultado; // a cada 15 dias
  assert.equal(meio.custo_mes_media, 43333);
});

test('vale-transporte recusado: sem custo para o empregador', () => {
  const r = M.calcularDomestico({ salario: 162100, custoVtMes: 20000, recusaVt: true }, D);
  assert.equal(r.resultado.vt_desconto, 0);
  assert.equal(r.resultado.vt_empregador, 0);
  assert.equal(r.resultado.custo_mensal, 194520);
  assert.equal(r.resultado.custo_anual, M.calcularDomestico({ salario: 162100 }, D).resultado.custo_anual);
  assert.match(passoDe(r, 'vt_empregador').formula, /recusou o vale: sem custo/);
});

test('entrada null não lança erro', () => {
  for (const f of [M.calcularInss, M.calcularIrrf, M.calcularPorHora, M.calcularPorHoraInverso,
    M.calcularDiarista, M.calcularDomestico, M.converterSalario, M.tabelaComparacao]) {
    const r = f(null, D, null);
    assert.ok(Array.isArray(r.alertas), f.name);
    assert.ok(r.alertas.some((a) => a.codigo === 'entrada_invalida'), f.name);
  }
});

test('por hora com média 52/12: arredonda uma vez só no fim', () => {
  const r = M.calcularPorHora({ valorHora: 'R$ 10,01', horasDia: 1.5, diasSemana: 1 }, D);
  assert.equal(r.resultado.total, 6507); // 1001 × 1,5 × 52 ÷ 12 = 6506,5
  // o caminho com dias equivalentes dá o mesmo valor
  const d = M.calcularPorHora({ valorHora: 'R$ 10,01', horasDia: 1.5, dias: 52 / 12 }, D);
  assert.equal(d.resultado.total, 6507);
});

test('média fracionária acima de 2 dias por semana gera alerta de vínculo', () => {
  const r = M.calcularDiarista({ valorDiaria: 15000, diasSemana: 2.5 }, D);
  const a = r.alertas.find((x) => x.codigo === 'vinculo_domestico');
  assert.ok(a);
  assert.match(a.texto, /2,5 dias/);
  assert.ok(!M.calcularDiarista({ valorDiaria: 15000, diasSemana: 1.5 }, D).alertas.some((x) => x.codigo === 'vinculo_domestico'));
  assert.ok(M.calcularDiarista({ valorDiaria: 15000, diasSemana: 2 }, D).alertas.some((x) => x.codigo === 'vinculo_limite'));
});

test('diarista: mês inexistente é recusado e usa o mês da data', () => {
  for (const mes of ['2026-13', '2026-00', 'nov']) {
    const r = M.calcularDiarista({ valorDiaria: 15000, diasDaSemana: [2, 4], mes }, D);
    assert.equal(r.resultado.mes, '2026-11', mes);
    assert.equal(r.resultado.dias_no_mes, 8);
    assert.ok(r.alertas.some((a) => a.codigo === 'entrada_invalida' && a.campo === 'mes'), mes);
  }
  const ok = M.calcularDiarista({ valorDiaria: 15000, diasDaSemana: [2, 4], mes: '2026-12' }, D);
  assert.equal(ok.resultado.mes, '2026-12');
  assert.ok(!ok.alertas.some((a) => a.campo === 'mes'));
});
