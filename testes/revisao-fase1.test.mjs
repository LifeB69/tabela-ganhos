// Revisão da Fase 1 (20/11/2026, UTC): problemas apontados pelos revisores que dá para testar sem navegador.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as motor from '../js/motor/index.js';
import { mesclarConfig, normalizarConfig, CONFIG_PADRAO, dataNaFaixa, OVERRIDES_ACEITOS } from '../js/dados/config.js';
import { armazem, normalizarSalvo, _usarBackendParaTeste, FORMATO_BACKUP } from '../js/dados/armazem.js';
import { gerarLink, lerLink } from '../js/compartilhar.js';
import { sugerirModo } from '../js/telas/calcular/questionario.js';
import { MUDANCAS } from '../dados/leis.js';

const raiz = new URL('..', import.meta.url);
const ler = (p) => readFileSync(new URL(p, raiz), 'utf8');

test('questionário: com 3 dias ou mais diz "pode ser", nunca "a conta certa é"', () => {
  const s = sugerirModo({ casa: 'sim', dias: '3', paga: 'dia', fixo: 'sim' }, motor, '2026-11-20');
  assert.equal(s.modo, 'domestico');
  assert.match(s.texto, /pode ser emprego doméstico/);
  assert.doesNotMatch(s.texto, /conta certa/);
});

test('overrides: só as chaves que a tela Mais edita, com faixa plausível', () => {
  const c = mesclarConfig(CONFIG_PADRAO, {
    overrides: { inss_empregado: 5, irrf_mensal: 0, salario_minimo: 1, piso_domestico_SP: 200000, divisor_hora: 200, piso_domestico_RS: -1 },
  });
  assert.deepEqual(c.overrides, { piso_domestico_SP: 200000, divisor_hora: 200 });
  assert.deepEqual(normalizarConfig({ overrides: { divisor_hora: 5000, piso_domestico_SC: 1.5 } }).overrides, {});
  assert.deepEqual(Object.keys(OVERRIDES_ACEITOS).sort(), ['divisor_hora', 'piso_domestico_RS', 'piso_domestico_SC', 'piso_domestico_SP']);
  // Com o que sobra, a conta do doméstico não quebra
  assert.doesNotThrow(() => motor.calcularDomestico({ salario: '2.000,00', uf: 'SP' }, '2026-11-20', { overrides: c.overrides }));
});

test('backup alterado com override que é objeto no motor não grava nada que quebre as contas', async () => {
  _usarBackendParaTeste('memoria');
  const r = await armazem.importarTudo({ formato: FORMATO_BACKUP, versao_formato: 1, salvos: [], config: { overrides: { inss_empregado: 5, irrf_mensal: 0 } } });
  assert.equal(r.ok, true);
  assert.deepEqual((await armazem.obterConfig()).overrides, {});
});

test('salvo sem valor continua sem valor (null não vira R$ 0,00)', async () => {
  assert.equal(normalizarSalvo({ modo: 'porHora', resumo: { valor_centavos: null } }).resumo.valor_centavos, null);
  assert.equal(normalizarSalvo({ modo: 'porHora', resumo: { valor_centavos: '' } }).resumo.valor_centavos, null);
  assert.equal(normalizarSalvo({ modo: 'porHora', resumo: { valor_centavos: 1234 } }).resumo.valor_centavos, 1234);
  _usarBackendParaTeste('memoria');
  const s = await armazem.salvarSalvo({ modo: 'porHora', titulo: 'teste', entrada: { valorHora: 1000 } });
  assert.equal((await armazem.obterSalvo(s.id)).resumo.valor_centavos, null);
});

test('importar "substituir" sem nenhum cálculo legível não apaga os do aparelho', async () => {
  _usarBackendParaTeste('memoria');
  await armazem.salvarSalvo({ modo: 'porHora', titulo: 'meu', entrada: { valorHora: 1000 } });
  const r = await armazem.importarTudo({ formato: FORMATO_BACKUP, versao_formato: 1, salvos: [{ modo: 'xyz' }] }, { modo: 'substituir' });
  assert.equal(r.ok, false);
  assert.match(r.mensagem, /não foram mexidos/);
  assert.equal((await armazem.listarSalvos()).length, 1);
  const r2 = await armazem.importarTudo({ formato: FORMATO_BACKUP, versao_formato: 1, salvos: [{ modo: 'diarista', titulo: 'novo' }] }, { modo: 'substituir' });
  assert.equal(r2.ok, true);
  assert.equal(r2.salvos_importados, 1);
  assert.deepEqual((await armazem.listarSalvos()).map((s) => s.titulo), ['novo']);
});

test('datas: link e salvo só aceitam de 2000 a 2099', () => {
  assert.equal(dataNaFaixa('1999-12-31'), false);
  assert.equal(dataNaFaixa('2000-01-01'), true);
  assert.equal(dataNaFaixa('2100-01-01'), false);
  const pacote = (d) => `#c=${Buffer.from(JSON.stringify({ v: 1, m: 'porHora', e: { valorHora: 1000, horasDia: 8, dias: 20 }, d })).toString('base64url')}`;
  const valido = lerLink(gerarLink({ modo: 'porHora', entrada: { valorHora: 1000, horasDia: 8, dias: 20 }, data: '2026-11-20' }));
  assert.equal(valido.ok, true);
  const antigo = lerLink(pacote('1900-01-01'));
  if (antigo.ok) assert.fail('link com data de 1900 foi aceito');
  assert.equal(antigo.erro, 'A data do link é inválida.');
  assert.equal(lerLink(pacote('2026-11-20')).ok, true);
  assert.equal(normalizarSalvo({ modo: 'porHora', data_referencia: '1988-10-04' }).data_referencia, null);
  assert.equal(normalizarConfig({ dataReferencia: '1950-01-01' }).dataReferencia, 'auto');
});

test('"O que mudou" não diz que todos os números foram conferidos em fonte oficial', () => {
  for (const m of MUDANCAS) assert.doesNotMatch(m.texto, /Todos os números/);
});

test('telas: textos e guardas da revisão', () => {
  const diarista = ler('js/telas/calcular/diarista.js');
  assert.doesNotMatch(diarista, /nota: 'Diarista até 2 dias/, 'a nota do compartilhar precisa depender dos dias');
  const calcular = ler('js/telas/calcular.js');
  assert.match(calcular, /Object\.create\(null\)/);
  assert.match(calcular, /modoValido\(memoria\.modo\)/);
  assert.match(calcular, /e\.detail\.tarde/);
  assert.match(calcular, /Atenção: /);
  const legal = ler('js/telas/mais/legal.js');
  assert.doesNotMatch(legal, /v\.observacao \?/, 'a observação crua do parâmetro não vai para a tela');
  assert.doesNotMatch(ler('js/telas/calcular/domestico.js'), /Não informado \(mínimo nacional\)/);
  assert.match(ler('js/telas/calcular/acoes.js'), /tituloSugerido \|\| ''/);
});

test('CSS: foco não fica atrás das abas e o foco do topo tem cor própria', () => {
  const base = ler('css/base.css');
  assert.match(base, /html \{ scroll-padding-bottom: calc\(var\(--altura-abas\)/);
  assert.match(base, /\.topo :focus-visible \{ outline-color: var\(--cor-foco-topo/);
  assert.match(ler('css/tokens.css'), /--cor-foco-topo: #8FB4FF/);
});

test('sw.js: só a casca vai para a chave de index.html, e só se for HTML', () => {
  const sw = ler('sw.js');
  assert.match(sw, /if \(navegacao && !ehCasca\(url\)\) return;/);
  assert.match(sw, /\(!navegacao \|\| ehHtml\(res\)\)/);
});

test('app.js: nada é gravado antes de a config guardada ser lida', () => {
  const app = ler('js/app.js');
  assert.match(app, /if \(estado\.configCarregada\) \{/);
  assert.match(app, /estado\.pendentes\.push/);
});
