// Testes da camada de dados da interface (sem navegador): config, migração da v1, armazém em memória e link compartilhado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG_PADRAO, normalizarConfig, mesclarConfig, converterV1, centavosArredondamento, dataReferenciaDe, aparencia } from '../js/dados/config.js';
import { armazem, normalizarSalvo, _usarBackendParaTeste, FORMATO_BACKUP } from '../js/dados/armazem.js';
import { gerarLink, lerLink, entradaSoNumerica, textoWhatsApp } from '../js/compartilhar.js';

test('config padrão: visual A, tema automático, sem arredondamento, data automática', () => {
  const c = normalizarConfig({});
  assert.equal(c.visual, 'a');
  assert.equal(c.tema, 'auto');
  assert.equal(c.arredondamento, 'nenhum');
  assert.equal(c.dataReferencia, 'auto');
  assert.equal(c.grupoPR, 'II');
  assert.deepEqual(c.padroes.diasSemana, [1, 2, 3, 4, 5]);
  assert.deepEqual(c, normalizarConfig(CONFIG_PADRAO));
});

test('config: valores inválidos voltam ao padrão; UF em maiúscula; dias únicos e ordenados', () => {
  const c = normalizarConfig({ visual: 'z', tema: 'roxo', uf: 'sp', padroes: { horasDia: '4,5', diasSemana: [5, 1, 1, 9, 'x'] }, dataReferencia: '2026-13-01', arredondamento: '0,50' });
  assert.equal(c.visual, 'a');
  assert.equal(c.tema, 'auto');
  assert.equal(c.uf, 'SP');
  assert.equal(c.padroes.horasDia, 4.5);
  assert.deepEqual(c.padroes.diasSemana, [1, 5]);
  assert.equal(c.dataReferencia, 'auto');
  assert.equal(centavosArredondamento(c), 50);
});

test('mesclarConfig: mescla padroes e remove override com null', () => {
  let c = mesclarConfig(CONFIG_PADRAO, { padroes: { horasDia: 6 }, overrides: { divisor_hora: 200 } });
  assert.equal(c.padroes.horasDia, 6);
  assert.deepEqual(c.padroes.diasSemana, [1, 2, 3, 4, 5]);
  assert.equal(c.overrides.divisor_hora, 200);
  c = mesclarConfig(c, { overrides: { divisor_hora: null } });
  assert.deepEqual(c.overrides, {});
  assert.deepEqual(Object.keys(aparencia(c)), ['visual', 'tema', 'letra', 'contraste', 'movimento']);
});

test('dataReferenciaDe: auto = hoje; data fixa é respeitada', () => {
  assert.equal(dataReferenciaDe({ dataReferencia: 'auto' }, new Date(2026, 10, 20, 23, 0)), '2026-11-20');
  assert.equal(dataReferenciaDe({ dataReferencia: '2027-01-15' }), '2027-01-15');
});

test('converterV1: tema, valor/hora e horas/dia da v1 viram config', () => {
  assert.equal(converterV1({}), null);
  const p = converterV1({ tema: 'dark', visao: '12', calc: JSON.stringify({ h: 4, d: 10, r: 12, m: '500' }) });
  const c = mesclarConfig(CONFIG_PADRAO, p);
  assert.equal(c.tema, 'escuro');
  assert.equal(c.padroes.valorHora, '12,00');
  assert.equal(c.padroes.horasDia, 4);
  assert.equal(c.legadoV1.calc.dias, 10);
  assert.equal(c.legadoV1.visao_tabela, '12');
  assert.doesNotThrow(() => converterV1({ calc: '{quebrado' }));
});

test('normalizarSalvo: limpa texto, recusa modo desconhecido, limita etiquetas', () => {
  assert.equal(normalizarSalvo({ modo: 'clt' }), null);
  const s = normalizarSalvo({
    modo: 'diarista', titulo: '<img src=x onerror=alert(1)>\u0000', etiquetas: ['a', 'a', ' b ', ''],
    entrada: { valorDiaria: '200', diasDaSemana: [1, 3], fn: () => 1, 'chave ruim': 1, obj: { x: { y: 1 } } },
    resumo: { rotulo: 'Custo do mês', valor_centavos: 160000 },
  });
  assert.equal(s.titulo, '<img src=x onerror=alert(1)>');   // continua texto puro; a tela põe como texto
  assert.deepEqual(s.etiquetas, ['a', 'b']);
  assert.deepEqual(s.entrada, { valorDiaria: '200', diasDaSemana: [1, 3], obj: {} });
  assert.equal(s.resumo.valor_centavos, 160000);
  assert.ok(s.id && s.criado_em && s.editado_em);
});

test('armazém em memória: salvar, listar (fixados primeiro), apagar e restaurar, backup e importação', async () => {
  _usarBackendParaTeste('memoria');
  assert.equal(await armazem.iniciar(), 'memoria');
  const cfg = await armazem.obterConfig();
  assert.equal(cfg.visual, 'a');
  await armazem.salvarConfig({ ...cfg, visual: 'c' });
  assert.equal((await armazem.obterConfig()).visual, 'c');

  const a = await armazem.salvarSalvo({ modo: 'porHora', titulo: 'A' });
  const b = await armazem.salvarSalvo({ modo: 'domestico', titulo: 'B', fixado: true });
  let lista = await armazem.listarSalvos();
  assert.deepEqual(lista.map((s) => s.titulo), ['B', 'A']);
  const apagado = await armazem.apagarSalvo(a.id);
  assert.equal(apagado.titulo, 'A');
  assert.equal((await armazem.listarSalvos()).length, 1);
  await armazem.restaurarSalvo(apagado);
  const volta = await armazem.obterSalvo(a.id);
  assert.equal(volta.criado_em, a.criado_em);

  const backup = await armazem.exportarTudo();
  assert.equal(backup.formato, FORMATO_BACKUP);
  assert.equal(backup.salvos.length, 2);
  await armazem.apagarTudo();
  assert.equal((await armazem.listarSalvos()).length, 0);
  const r = await armazem.importarTudo(JSON.stringify(backup));
  assert.equal(r.ok, true);
  assert.equal(r.salvos_importados, 2);
  assert.equal((await armazem.obterConfig()).visual, 'c');
  assert.equal((await armazem.importarTudo('não é json')).ok, false);
  assert.equal((await armazem.importarTudo({ formato: FORMATO_BACKUP, versao_formato: 99 })).ok, false);
  const repetido = await armazem.importarTudo(backup);
  assert.equal(repetido.salvos_importados, 0);
  assert.equal(b.fixado, true);
});

test('link compartilhado: ida e volta só com números', () => {
  const link = gerarLink({ modo: 'diarista', entrada: { valorDiaria: '200,00', diasDaSemana: [2, 4], mesmaResidencia: true, nome: 'Ana', notas: 'x' }, data: '2026-11-20' });
  assert.match(link, /#c=[A-Za-z0-9_-]+$/);
  const r = lerLink(link);
  assert.equal(r.ok, true);
  assert.deepEqual(r.estado, { modo: 'diarista', entrada: { valorDiaria: '200,00', diasDaSemana: [2, 4], mesmaResidencia: true }, data: '2026-11-20' });
});

test('link compartilhado: recusa modo, texto, chave extra e base64 quebrado', () => {
  const cod = (o) => '#c=' + Buffer.from(JSON.stringify(o)).toString('base64url');
  assert.equal(lerLink(cod({ v: 1, m: 'clt', e: {} })).ok, false);
  assert.equal(lerLink(cod({ v: 1, m: 'porHora', e: { nome: 'Ana' } })).ok, false);
  assert.equal(lerLink(cod({ v: 1, m: 'porHora', e: {}, x: 1 })).ok, false);
  assert.equal(lerLink(cod({ v: 2, m: 'porHora', e: {} })).ok, false);
  assert.equal(lerLink(cod({ v: 1, m: 'porHora', e: {}, d: '2026-02-30' })).ok, false);
  assert.equal(lerLink('#c=@@@').ok, false);
  assert.equal(lerLink('#c=' + 'A'.repeat(3000)).ok, false);
  assert.equal(lerLink(cod({ v: 1, m: 'domestico', e: { tipo: 'horista', uf: 'SP', valorHora: '12,5' } })).ok, true);
  assert.deepEqual(entradaSoNumerica({ a: '<b>', b: 'R$ 10', c: '10', d: Infinity }), { c: '10' });
});

test('texto de WhatsApp tem o aviso legal e não quebra com dados ruins', () => {
  const t = textoWhatsApp({ titulo: 'Diarista', linhas: [{ rotulo: 'Custo do mês', valor_centavos: 160000 }, { rotulo: 'Dias', texto: '8' }], data: '2026-11-20', link: 'https://exemplo/#c=x' });
  assert.match(t, /\*Diarista\*/);
  assert.match(t, /Custo do mês: R\$ 1\.600,00/);
  assert.match(t, /não substitui contador/);
  assert.doesNotThrow(() => textoWhatsApp({ linhas: [null, {}] }));
});

test('config v2: calcular, tabela e backup validados e mesclados por chave', async () => {
  const { normalizarConfig: n, mesclarConfig: m, CONFIG_PADRAO: P } = await import('../js/dados/config.js');
  const c = n({
    calcular: { modo: 'domestico', porHora: { valorHora: 2000, x: { y: { z: 1 } } }, outro: { a: 1 } },
    tabela: { valores: [1000, -1, 1.5, 1200], diasDe: 0, diasAte: 15, ver: 'v1', horasAte: 99 },
    backup: { ultimo: 'xx', lembreteAdiadoAte: '2026-11-27T00:00:00.000Z' },
    overrides: { piso_domestico_SP: 200000 },
  });
  assert.deepEqual(c.calcular, { modo: 'domestico', porHora: { valorHora: 2000, x: {} } });
  assert.deepEqual(c.tabela, { valores: [1000, 1200], diasAte: 15, ver: 'v1' });
  assert.deepEqual(c.backup, { ultimo: null, lembreteAdiadoAte: '2026-11-27T00:00:00.000Z' });
  assert.equal(c.overrides.piso_domestico_SP, 200000);
  const d = m(m(P, { calcular: { porHora: { valorHora: 1 } } }), { calcular: { modo: 'diarista' } });
  assert.deepEqual(d.calcular, { porHora: { valorHora: 1 }, modo: 'diarista' });
  const b = m(m(P, { backup: { ultimo: '2026-11-20T10:00:00.000Z' } }), { backup: { lembreteAdiadoAte: '2026-11-27T10:00:00.000Z' } });
  assert.equal(b.backup.ultimo, '2026-11-20T10:00:00.000Z');
});
