// Testes do robô de valores (robo/). Tudo com respostas gravadas em testes/fixtures/robo/: nada sai para a rede.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { executar } from '../robo/robo.js';
import { lerAuto, lerEstado, textoAuto, autoVazio, CAMINHO_AUTO } from '../robo/arquivos.js';
import { diarioCompativel, projetarMinimo, derivarMeiDas, decidirMinimo } from '../robo/regras.js';
import { pastaAto, urlQuadro, urlMinuscula } from '../robo/fontes/planalto.js';
import { resumoNormalizado, sha256 } from '../robo/texto.js';
import { GANHO_REAL_LIMITES_PCT, PIB_REAL_PCT } from '../robo/config.js';
import { PARAMETROS_MANUAIS, mesclarAuto, problemasAuto, dataDoRobo } from '../dados/parametros.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIX = join(RAIZ, 'testes/fixtures/robo');
const silencio = () => {};

function raizTemp(auto = null) {
  const d = mkdtempSync(join(tmpdir(), 'robo-'));
  mkdirSync(join(d, 'dados'));
  mkdirSync(join(d, 'robo'));
  if (auto) writeFileSync(join(d, CAMINHO_AUTO), textoAuto(auto));
  return d;
}
const rodar = (raiz, cenario, hoje, extra = {}) => executar({
  raiz, hoje, agora: new Date(`${hoje}T12:00:00Z`), fixtures: join(FIX, cenario), token: null, log: silencio, diasCommit: 0, ...extra,
});
const vig = (auto, chave, desde) => (auto.vigencias[chave] || []).find((v) => v.vigente_desde === desde);
const mesclado = (auto, chave) => mesclarAuto(PARAMETROS_MANUAIS, auto).find((p) => p.chave === chave).vigencias;

// ───────────── Regras puras ─────────────
test('robô: o diário do mínimo não tem regra fixa de arredondamento (só o decreto diz)', () => {
  // Decreto 8.948/2016: R$ 937 → R$ 31,23 (para baixo); MP 919/2020: R$ 1.045 → R$ 34,83 (para baixo);
  // Decreto 12.797/2025: R$ 1.621 → R$ 54,04 (para cima). Nenhuma regra única reproduz os três.
  const casos = [[93700, 3123], [104500, 3483], [162100, 5404], [151800, 5060]];
  for (const [m, d] of casos) assert.ok(diarioCompativel(m, d), `${m} → ${d}`);
  assert.ok(!casos.every(([m, d]) => Math.ceil(m / 30) === d), 'teto não reproduz 2017 e 2020');
  assert.ok(!casos.every(([m, d]) => Math.round(m / 30) === d), 'mais próximo não reproduz 2026');
  assert.ok(!diarioCompativel(162100, 5410));
});

test('robô: projeção pela Lei 14.663 + 15.077 reproduz os mínimos de 2025 e 2026', () => {
  // 2025: 1.412 × (1 + 4,84% INPC nov/2024) × (1 + PIB 2023 limitado a 2,5%) = 1.517,35 → 1.518
  assert.equal(projetarMinimo(141200, 4.84, 3.2, GANHO_REAL_LIMITES_PCT).mensal, 151800);
  // 2026: 1.518 × (1 + 4,18% INPC nov/2025) × (1 + 2,5%) = 1.620,99 → 1.621
  assert.equal(projetarMinimo(151800, 4.18, 3.4, GANHO_REAL_LIMITES_PCT).mensal, 162100);
  assert.equal(projetarMinimo(100000, 4, 0.1, GANHO_REAL_LIMITES_PCT).ganho_real_pct, 0.6);
  assert.equal(PIB_REAL_PCT[2025], 2.3);
});

test('robô: DAS do MEI = 5% do mínimo + R$ 1 / R$ 5', () => {
  const atual = PARAMETROS_MANUAIS.find((p) => p.chave === 'mei_das').vigencias[0].valor;
  assert.deepEqual(derivarMeiDas(162100, atual), atual);   // reproduz 2026: 81,05 + 1 + 5
  assert.deepEqual(derivarMeiDas(172000, atual), { inss: 8600, icms: 100, iss: 500 });
});

test('robô: pasta do Planalto por quadriênio, quadro e redirecionamento para minúscula', () => {
  assert.equal(pastaAto(2026), '_ato2023-2026');
  assert.equal(pastaAto(2027), '_ato2027-2030');
  assert.equal(pastaAto(2030), '_ato2027-2030');
  assert.equal(pastaAto(2031), '_ato2031-2034');
  assert.equal(urlQuadro(2027), 'https://www.planalto.gov.br/ccivil_03/_ato2027-2030/2027/decreto/_decretos2027.htm');
  assert.equal(urlMinuscula('https://x/_ato2023-2026/2026/decreto/D13250.htm'), 'https://x/_ato2023-2026/2026/decreto/d13250.htm');
});

test('robô: decisão do mínimo — valor menor ou igual ao anterior na série não é aplicado', () => {
  const anterior = { valor: { mensal: 162100 } };
  assert.equal(decidirMinimo({ ano: 2027, decreto: null, valorSerie: 162100, anterior, aumentoMaximoPct: 15 }).acao, 'esperar');
  assert.equal(decidirMinimo({ ano: 2027, decreto: null, valorSerie: 250000, anterior, aumentoMaximoPct: 15 }).acao, 'issue');
  assert.equal(decidirMinimo({ ano: 2027, decreto: null, valorSerie: null, anterior, aumentoMaximoPct: 15 }).acao, 'esperar');
});

test('robô: resumo normalizado ignora scripts, espaços e "Atualizado em"', () => {
  const a = readFileSync(join(FIX, 'comum/piso-generico.html'), 'utf8');
  const b = readFileSync(join(FIX, 'comum/piso-generico-so-data.html'), 'utf8');
  const c = readFileSync(join(FIX, 'comum/piso-generico-mudou.html'), 'utf8');
  assert.equal(sha256(resumoNormalizado(a)), sha256(resumoNormalizado(b)));
  assert.notEqual(sha256(resumoNormalizado(a)), sha256(resumoNormalizado(c)));
});

// ───────────── Mescla com os parâmetros manuais ─────────────
test('mescla: o robô nunca troca nem apaga vigência oficial escrita à mão', () => {
  const auto = { formato: 1, gerado_em: '2027-01-02T00:00:00Z', vigencias: {
    inss_empregado: [{ valor: { faixas: [], teto: 1 }, vigente_desde: '2026-01-01', vigente_ate: null, status: 'vigente', fonte_url: 'https://x', lei: 'teste' }],
    chave_que_nao_existe: [{ valor: 1, vigente_desde: '2027-01-01', vigente_ate: null, status: 'vigente', fonte_url: 'https://x', lei: 'teste' }],
    salario_minimo: [{ valor: { mensal: 1 }, vigente_desde: '2027-01-01', vigente_ate: null, status: 'vigente', fonte_url: 'http://sem-https', lei: 'x' }],
  } };
  const m = mesclarAuto(PARAMETROS_MANUAIS, auto);
  const manual = PARAMETROS_MANUAIS.find((p) => p.chave === 'inss_empregado');
  assert.deepEqual(m.find((p) => p.chave === 'inss_empregado'), manual);
  assert.equal(m.length, PARAMETROS_MANUAIS.length);
  // vigência sem https é recusada: a 'previsto' manual de 2027 fica
  assert.equal(m.find((p) => p.chave === 'salario_minimo').vigencias.find((v) => v.vigente_desde === '2027-01-01').status, 'previsto');
  // a lista manual não foi alterada
  assert.equal(PARAMETROS_MANUAIS.find((p) => p.chave === 'salario_minimo').vigencias[0].vigente_ate, null);
});

test('mescla: vigência do robô substitui a "previsto" de mesma data e encerra a anterior na véspera', () => {
  const auto = { formato: 1, gerado_em: '2026-12-28T00:00:00Z', vigencias: {
    salario_minimo: [{ valor: { mensal: 172000, diario: 5734, horario: 782 }, vigente_desde: '2027-01-01', vigente_ate: null, status: 'vigente', fonte_url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d13250.htm', lei: 'Decreto' }],
  } };
  const v = mesclado(auto, 'salario_minimo');
  assert.equal(v.filter((x) => x.vigente_desde === '2027-01-01').length, 1, 'sem duplicar vigente_desde');
  assert.equal(v.find((x) => x.vigente_desde === '2027-01-01').status, 'vigente');
  assert.equal(v.find((x) => x.vigente_desde === '2027-01-01').origem, 'robo');
  assert.equal(v.find((x) => x.vigente_desde === '2026-01-01').vigente_ate, '2026-12-31');
  // e uma 'previsto' do robô nunca rebaixa uma 'vigente'
  const auto2 = { ...auto, vigencias: { salario_minimo: [{ ...auto.vigencias.salario_minimo[0], status: 'previsto', vigente_desde: '2026-01-01' }] } };
  assert.equal(mesclado(auto2, 'salario_minimo').find((x) => x.vigente_desde === '2026-01-01').valor.mensal, 162100);
});

// ───────────── Rodadas com fixtures ─────────────
test('robô: rodada de hoje (21/11/2026) não aplica nada e grava só o estado', async () => {
  const raiz = raizTemp();
  const r = await rodar(raiz, 'hoje', '2026-11-21');
  assert.deepEqual(r.aplicado, []);
  assert.deepEqual(r.previsto, []);
  assert.equal(r.fontes.inss.lido.teto, 847555);
  assert.equal(r.fontes.salario_familia.lido.cota_por_filho, 6754);
  assert.equal(r.fontes.ibge_inpc.lido.periodo, '202610');
  assert.deepEqual(r.fontes.bcb_sgs_1619.anos, { 2025: 151800, 2026: 162100 });
  assert.equal(r.issues.length, 0, 'INSS e salário-família da página batem com o app');
  assert.ok(!existsSync(join(raiz, CAMINHO_AUTO)), 'nada novo: o arquivo do robô nem é criado');
  const estado = lerEstado(raiz);
  assert.ok(estado.fontes.piso_SP.hash && estado.fontes.irrf_2026.hash);
  assert.equal(estado.fontes.irrf_2027.status, 404);
  assert.ok(estado.erros.some((e) => e.onde === 'planalto_quadro_2026'));
  // segunda rodada igual: nada relevante mudou → não publica
  const r2 = await rodar(raiz, 'hoje', '2026-11-22');
  assert.equal(r2.publicar, false);
  rmSync(raiz, { recursive: true });
});

test('robô: decreto 2026 real (Decreto 12.797) é achado no quadro e lido', async () => {
  const { acharDecretoMinimo, lerDecretoMinimo } = await import('../robo/fontes/planalto.js');
  const { decodificar } = await import('../robo/rede.js');
  const ler = (f) => decodificar(new Uint8Array(readFileSync(join(FIX, 'comum', f))), 'text/html');
  const achados = acharDecretoMinimo(ler('quadro-2025.htm'), urlQuadro(2025), 2026);
  assert.equal(achados.length, 1);
  assert.equal(achados[0].url, 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/D12797.htm');
  const d = lerDecretoMinimo(ler('decreto-12797-2026.htm'));   // windows-1252
  assert.deepEqual({ ok: d.ok, numero: d.numero, mensal: d.mensal, diario: d.diario, horario: d.horario, vigente_desde: d.vigente_desde },
    { ok: true, numero: '12.797', mensal: 162100, diario: 5404, horario: 737, vigente_desde: '2026-01-01' });
  // em janeiro de 2026, sem o mínimo de 2026 no app, o robô aplicaria exatamente o que está à mão
  const r = await executar({ raiz: raizTemp(), hoje: '2026-01-02', agora: new Date('2026-01-02T12:00:00Z'), fixtures: join(FIX, 'decreto-2026-real'), seco: true, log: silencio });
  assert.equal(r.fontes.minimo_2026, undefined, 'o mínimo de 2026 já é oficial à mão: não procura');
});

test('robô: decreto do ano novo (link em maiúscula → minúscula) aplica mínimo e derivados', async () => {
  const raiz = raizTemp();
  const r = await rodar(raiz, 'decreto-2027', '2026-12-28');
  const auto = lerAuto(raiz);
  const m = vig(auto, 'salario_minimo', '2027-01-01');
  assert.equal(m.status, 'vigente');
  assert.deepEqual(m.valor, { mensal: 172000, diario: 5734, horario: 782 });
  assert.equal(m.fonte_url, 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d13250.htm');
  assert.match(m.lei, /Decreto 13\.250/);
  assert.deepEqual(vig(auto, 'mei_das', '2027-01-01').valor, { inss: 8600, icms: 100, iss: 500 });
  assert.equal(vig(auto, 'autonomo', '2027-01-01'), undefined, 'autônomo só com o teto do INSS do ano (portaria)');
  assert.ok(r.avisos.some((a) => /autônomo de 2027: esperando a tabela do INSS/.test(a)));
  assert.equal(vig(auto, 'autonomo_retencao_empresa', '2027-01-01'), undefined, 'retenção só muda com a portaria');
  // primeira faixa do INSS NÃO é derivada do mínimo
  assert.equal(vig(auto, 'inss_empregado', '2027-01-01'), undefined);
  // INPC de novembro (fictício) com o mínimo de 2027 já oficial: sem projeção
  assert.equal(vig(auto, 'salario_minimo', '2027-01-01').status, 'vigente');
  assert.ok(r.publicar);
  assert.ok(auto.gerado_em.startsWith('2026-12-28'));
  // a mescla não sobrepõe e o previsto manual de 2027 some (substituído)
  const v = mesclado(auto, 'salario_minimo');
  assert.equal(v.find((x) => x.vigente_desde === '2026-01-01').vigente_ate, '2026-12-31');
  assert.equal(v.filter((x) => x.status === 'previsto').length, 0);
  // rodar de novo no dia seguinte não reescreve nada
  const antes = readFileSync(join(raiz, CAMINHO_AUTO), 'utf8');
  const r2 = await rodar(raiz, 'decreto-2027', '2026-12-29');
  assert.deepEqual(r2.aplicado, []);
  assert.equal(readFileSync(join(raiz, CAMINHO_AUTO), 'utf8'), antes);
  rmSync(raiz, { recursive: true });
});

test('robô: decreto e série do BCB batendo aplicam o mínimo', async () => {
  const raiz = raizTemp();
  const r = await rodar(raiz, 'decreto-e-bcb-2027', '2027-01-05');
  assert.match(r.fontes.minimo_2027.resumo, /confere com o BCB/);
  assert.equal(vig(lerAuto(raiz), 'salario_minimo', '2027-01-01').valor.mensal, 172000);
  assert.equal(r.issues.length, 0);
  rmSync(raiz, { recursive: true });
});

test('robô: só a série do BCB tem o ano novo → aplica o mensal e calcula o diário', async () => {
  const raiz = raizTemp();
  const r = await rodar(raiz, 'so-bcb-2027', '2027-01-05');
  const m = vig(lerAuto(raiz), 'salario_minimo', '2027-01-01');
  assert.deepEqual(m.valor, { mensal: 172000, diario: null, horario: null }, 'diário e hora só do decreto');
  assert.match(m.observacao, /conta do app/i);
  assert.match(m.fonte_url, /^https:\/\/api\.bcb\.gov\.br\//);
  assert.equal(r.aplicado.length, 2, 'mínimo e DAS do MEI (autônomo espera a portaria)');
  rmSync(raiz, { recursive: true });
});

test('robô: série do BCB repetindo o valor antigo em janeiro não vira o mínimo novo', async () => {
  const raiz = raizTemp();
  const r = await rodar(raiz, 'bcb-repete-2026', '2027-01-03');
  assert.deepEqual(r.aplicado, []);
  assert.equal(r.fontes.minimo_2027.decisao, 'esperar');
  rmSync(raiz, { recursive: true });
});

test('robô: fontes divergentes → não aplica e abre issue', async () => {
  const raiz = raizTemp();
  const r = await rodar(raiz, 'divergencia-2027', '2027-01-05');
  assert.deepEqual(r.aplicado, []);
  const auto = lerAuto(raiz);
  assert.notEqual((vig(auto, 'salario_minimo', '2027-01-01') || {}).status, 'vigente');
  assert.equal(vig(auto, 'mei_das', '2027-01-01'), undefined);
  assert.ok(r.issues.some((i) => /fontes divergem/.test(i.titulo) && i.situacao === 'impressa' && /1\.730,00/.test(i.corpo)));
  rmSync(raiz, { recursive: true });
});

test('robô: INPC de novembro grava a projeção como "previsto", fora da conta', async () => {
  // 10/12/2026: INPC de novembro saiu (fictício, 4,20%); o decreto ainda não (Planalto sem resposta)
  const { criarBuscadorFixtures } = await import('../robo/rede.js');
  const base = criarBuscadorFixtures(join(FIX, 'decreto-2027'));
  const semPlanalto = (url, o) => (url.includes('planalto.gov.br') ? Promise.resolve({ ok: false, status: 0, url, url_final: url, tipo: '', bytes: null, texto: '', erro: 'ECONNRESET' }) : base(url, o));
  const raiz3 = raizTemp();
  const r3 = await rodar(raiz3, 'decreto-2027', '2026-12-10', { buscar: semPlanalto });
  const p = vig(lerAuto(raiz3), 'salario_minimo', '2027-01-01');
  // 1.621 × 1,042 × 1,023 = 1.727,9… → 1.728
  assert.equal(p.status, 'previsto');
  assert.deepEqual(p.valor, { mensal: 172800 });
  assert.match(p.observacao, /PROJEÇÃO do robô, não é o valor oficial/);
  assert.equal(r3.aplicado.length, 0);
  assert.equal(vig(lerAuto(raiz3), 'mei_das', '2027-01-01'), undefined, 'previsto não gera derivados');
  // a mescla troca a 'previsto' manual (PLN) pela projeção, e ela continua fora da conta
  const v = mesclado(lerAuto(raiz3), 'salario_minimo');
  assert.equal(v.find((x) => x.vigente_desde === '2027-01-01').valor.mensal, 172800);
  assert.equal(v.find((x) => x.vigente_desde === '2026-01-01').vigente_ate, null);
  // quando o decreto chega, a vigente substitui a projeção
  await rodar(raiz3, 'decreto-2027', '2026-12-28');
  assert.equal(vig(lerAuto(raiz3), 'salario_minimo', '2027-01-01').status, 'vigente');
  assert.equal(lerAuto(raiz3).vigencias.salario_minimo.length, 1);
  rmSync(raiz3, { recursive: true });
});

test('robô: página do INSS 2027 (fictícia) aplica faixas, teto, salário-família e atualiza o autônomo', async () => {
  const raiz = raizTemp();
  await rodar(raiz, 'decreto-e-bcb-2027', '2027-01-05');
  const r = await rodar(raiz, 'inss-2027', '2027-01-12');
  const auto = lerAuto(raiz);
  const inss = vig(auto, 'inss_empregado', '2027-01-01');
  assert.deepEqual(inss.valor, { faixas: [
    { ate: 172000, aliquota_pct: 7.5 }, { ate: 308000, aliquota_pct: 9 }, { ate: 462000, aliquota_pct: 12 }, { ate: 899300, aliquota_pct: 14 },
  ], teto: 899300 });
  assert.match(inss.lei, /Portaria Interministerial nº 4/);
  assert.deepEqual(vig(auto, 'salario_familia', '2027-01-01').valor, { cota_por_filho: 7160, limite_remuneracao: 209900 });
  assert.equal(vig(auto, 'autonomo', '2027-01-01').valor.base_maxima, 899300);
  assert.equal(vig(auto, 'autonomo_retencao_empresa', '2027-01-01').valor.teto_base, 899300);
  assert.equal(r.issues.length, 0);
  for (const chave of ['inss_empregado', 'salario_familia', 'autonomo', 'autonomo_retencao_empresa', 'mei_das']) {
    const of = mesclado(auto, chave).filter((v) => v.status === 'vigente');
    for (let i = 0; i < of.length - 1; i++) assert.ok(of[i].vigente_ate < of[i + 1].vigente_desde, `sobreposição em ${chave}`);
  }
  rmSync(raiz, { recursive: true });
});

test('robô: INSS 2027 antes do mínimo de 2027 só espera', async () => {
  const raiz = raizTemp();
  const { criarBuscadorFixtures } = await import('../robo/rede.js');
  const base = criarBuscadorFixtures(join(FIX, 'inss-2027'));
  const semMinimo = (url, o) => (url.includes('bcb.gov.br') ? base(url.replace(/./, 'x'), o) : base(url, o));
  const r = await rodar(raiz, 'inss-2027', '2027-01-12', { buscar: semMinimo });
  assert.equal(vig(lerAuto(raiz), 'inss_empregado', '2027-01-01'), undefined);
  assert.ok(r.avisos.some((a) => /esperando o mínimo/.test(a)));
  rmSync(raiz, { recursive: true });
});

for (const [cenario, padrao] of [['inss-2027-faixa-errada', /diferente do mínimo/], ['inss-2027-aliquota-mudou', /alíquotas mudaram/]]) {
  test(`robô: INSS 2027 que não passa nas checagens (${cenario}) → issue, sem aplicar`, async () => {
    const raiz = raizTemp();
    await rodar(raiz, 'decreto-e-bcb-2027', '2027-01-05');
    const r = await rodar(raiz, cenario, '2027-01-12');
    assert.equal(vig(lerAuto(raiz), 'inss_empregado', '2027-01-01'), undefined);
    assert.ok(r.issues.some((i) => /não passou nas checagens/.test(i.titulo)));
    assert.ok(r.issues.some((i) => padrao.test(i.corpo)));
    rmSync(raiz, { recursive: true });
  });
}

test('robô: páginas quebradas, vazias, 5xx e sem rede não apagam nem estragam nada', async () => {
  const raiz = raizTemp();
  await rodar(raiz, 'decreto-2027', '2026-12-28');
  await rodar(raiz, 'hoje', '2026-12-28');
  const autoAntes = readFileSync(join(raiz, CAMINHO_AUTO), 'utf8');
  const estadoAntes = lerEstado(raiz);
  for (const c of ['quebrado', 'sem-rede']) {
    const r = await rodar(raiz, c, '2026-12-30');
    assert.deepEqual(r.aplicado, [], c);
    assert.equal(readFileSync(join(raiz, CAMINHO_AUTO), 'utf8'), autoAntes, c);
    const e = lerEstado(raiz);
    for (const k of ['piso_SP', 'irrf_2026', 'irrf_indice']) assert.equal(e.fontes[k].hash, estadoAntes.fontes[k].hash, `${c}: ${k}`);
    assert.ok(e.erros.length > 0, `${c}: erros registrados`);
    assert.ok(!r.issues.some((i) => /mudou a página/.test(i.titulo)), `${c}: erro não é mudança`);
  }
  rmSync(raiz, { recursive: true });
});

test('robô: arquivo do robô corrompido → para sem gravar nada', async () => {
  const raiz = raizTemp();
  writeFileSync(join(raiz, CAMINHO_AUTO), 'export default {quebrado');
  await assert.rejects(() => rodar(raiz, 'decreto-2027', '2026-12-28'));
  assert.equal(readFileSync(join(raiz, CAMINHO_AUTO), 'utf8'), 'export default {quebrado');
  assert.ok(!existsSync(join(raiz, 'robo/estado.json')));
  rmSync(raiz, { recursive: true });
});

test('robô: vigia de piso — mudança de texto abre issue; só data/espaços/scripts não', async () => {
  const raiz = raizTemp();
  await rodar(raiz, 'hoje', '2026-11-21');
  const r1 = await rodar(raiz, 'piso-so-data', '2026-11-22');
  assert.ok(!r1.issues.some((i) => /mudou a página/.test(i.titulo)));
  const r2 = await rodar(raiz, 'piso-mudou', '2026-11-23');
  const t = r2.issues.filter((i) => /mudou a página/.test(i.titulo)).map((i) => i.titulo);
  assert.ok(t.some((x) => /RS/.test(x)) && t.some((x) => /PR/.test(x)));
  assert.ok(!t.some((x) => /SP/.test(x)));
  assert.equal(lerAuto(raiz).vigencias.piso_domestico_RS, undefined, 'só vigia, não aplica');
  assert.ok(r2.publicar);
  rmSync(raiz, { recursive: true });
});

test('robô: batimento quando o último commit tem mais de 45 dias', async () => {
  const raiz = raizTemp();
  await rodar(raiz, 'hoje', '2026-11-21');
  assert.equal((await rodar(raiz, 'hoje', '2026-11-22', { diasCommit: 45 })).publicar, false);
  const r = await rodar(raiz, 'hoje', '2026-11-23', { diasCommit: 46 });
  assert.ok(r.publicar);
  assert.ok(r.motivos.some((m) => /batimento/.test(m)));
  assert.equal(lerEstado(raiz).ultimo_batimento, '2026-11-23');
  rmSync(raiz, { recursive: true });
});

test('robô: --simular roda pela linha de comando sem gravar nada', () => {
  const antes = readFileSync(join(RAIZ, CAMINHO_AUTO), 'utf8');
  const estadoExiste = existsSync(join(RAIZ, 'robo/estado.json'));
  const estadoAntes = estadoExiste ? readFileSync(join(RAIZ, 'robo/estado.json'), 'utf8') : null;
  const saida = execFileSync(process.execPath, [join(RAIZ, 'robo/robo.js'), '--simular', '--hoje', '2026-11-21'], { encoding: 'utf8', env: { ...process.env, GITHUB_TOKEN: '', GITHUB_OUTPUT: '' } });
  const r = JSON.parse(saida.slice(saida.indexOf('{')));
  assert.equal(r.seco, true);
  assert.equal(r.fontes.inss.lido.teto, 847555);
  assert.equal(readFileSync(join(RAIZ, CAMINHO_AUTO), 'utf8'), antes);
  assert.equal(existsSync(join(RAIZ, 'robo/estado.json')) ? readFileSync(join(RAIZ, 'robo/estado.json'), 'utf8') : null, estadoAntes);
});

test('robô: dados/parametros-auto.js do repositório é válido e mescla sem sobreposição', () => {
  const auto = lerAuto(RAIZ);
  assert.ok(auto.vigencias && typeof auto.vigencias === 'object');
  assert.deepEqual(lerAuto(raizTemp(autoVazio())), autoVazio());
  for (const p of mesclarAuto(PARAMETROS_MANUAIS, auto)) {
    const of = p.vigencias.filter((v) => v.status === 'vigente');
    for (let i = 0; i < of.length - 1; i++) assert.ok(of[i].vigente_ate !== null && of[i].vigente_ate < of[i + 1].vigente_desde, p.chave);
  }
});

// ───────────── Correções da revisão (achados de 21/11/2026) ─────────────
const Q2026 = 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/_decretos2026.htm';
const D13250 = 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d13250.htm';
const BCB = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados';
/** Buscador de um cenário com algumas URLs trocadas: { url (ou prefixo): { arquivo?, status?, erro?, url_final? } }. */
async function buscadorCom(cenario, trocas) {
  const { criarBuscadorFixtures, decodificar } = await import('../robo/rede.js');
  const base = criarBuscadorFixtures(join(FIX, cenario));
  return async (url, o) => {
    const k = Object.keys(trocas).find((x) => url === x || (x.endsWith('*') && url.startsWith(x.slice(0, -1))));
    if (!k) return base(url, o);
    const t = trocas[k];
    if (t.erro) return { ok: false, status: t.status || 0, url, url_final: url, tipo: '', bytes: null, texto: '', erro: t.erro };
    const status = t.status || 200;
    const bytes = t.arquivo ? new Uint8Array(readFileSync(join(FIX, 'comum', t.arquivo))) : new Uint8Array();
    const ok = status >= 200 && status < 300;
    return { ok, status, url, url_final: t.url_final || url, tipo: t.tipo || 'text/html', bytes, texto: decodificar(bytes, t.tipo || 'text/html'), erro: ok ? null : `HTTP ${status}` };
  };
}

test('achado 1: redação tachada (revogada) não é lida; decreto alterado só entra com o BCB conferindo', async () => {
  const { lerDecretoMinimo } = await import('../robo/fontes/planalto.js');
  const tach = lerDecretoMinimo(readFileSync(join(FIX, 'comum/decreto-13250-tachado.htm'), 'utf8'));
  assert.deepEqual({ ok: tach.ok, mensal: tach.mensal, diario: tach.diario, horario: tach.horario, alterado: tach.alterado },
    { ok: true, mensal: 172000, diario: 5734, horario: 782, alterado: true }, 'lê a redação nova, não a tachada');
  const duas = lerDecretoMinimo(readFileSync(join(FIX, 'comum/decreto-13250-duas-redacoes.htm'), 'utf8'));
  assert.equal(duas.ok, false);
  assert.match(duas.motivo, /mais de uma redação/);
  // sem o BCB ter 2027: decreto alterado → espera, não aplica
  const raiz = raizTemp();
  const r = await rodar(raiz, 'decreto-2027', '2026-12-30', { buscar: await buscadorCom('decreto-2027', { [D13250]: { arquivo: 'decreto-13250-tachado.htm' } }) });
  assert.deepEqual(r.aplicado, []);
  assert.equal(r.fontes.minimo_2027.decisao, 'esperar');
  assert.match(r.fontes.minimo_2027.resumo, /alterada ou retificada/);
  // duas redações sem tachado → issue, sem aplicar
  const r2 = await rodar(raiz, 'decreto-2027', '2026-12-30', { buscar: await buscadorCom('decreto-2027', { [D13250]: { arquivo: 'decreto-13250-duas-redacoes.htm' } }) });
  assert.deepEqual(r2.aplicado, []);
  assert.ok(r2.issues.some((i) => /não consegui ler direito o decreto/.test(i.titulo) && /mais de uma redação/.test(i.corpo)));
  // com o BCB trazendo o mesmo valor em janeiro, o decreto alterado é aplicado
  const r3 = await rodar(raiz, 'decreto-e-bcb-2027', '2027-01-05', { buscar: await buscadorCom('decreto-e-bcb-2027', { 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D13250.htm': { arquivo: 'decreto-13250-tachado.htm' } }) });
  assert.deepEqual(vig(lerAuto(raiz), 'salario_minimo', '2027-01-01').valor, { mensal: 172000, diario: 5734, horario: 782 });
  assert.equal(r3.issues.length, 0);
  rmSync(raiz, { recursive: true });
});

test('achado 5: ordinal em <sup>o</sup> não derruba a leitura do decreto', async () => {
  const { lerDecretoMinimo } = await import('../robo/fontes/planalto.js');
  const d = lerDecretoMinimo(readFileSync(join(FIX, 'comum/decreto-13250-sup.htm'), 'utf8'));
  assert.deepEqual({ ok: d.ok, numero: d.numero, mensal: d.mensal, diario: d.diario, horario: d.horario, vigente_desde: d.vigente_desde },
    { ok: true, numero: '13.250', mensal: 172000, diario: 5734, horario: 782, vigente_desde: '2027-01-01' });
});

test('achado 6: decreto de outro servidor (link ou redirecionamento) nunca é aplicado', async () => {
  const { urlOficialPlanalto } = await import('../robo/fontes/planalto.js');
  assert.ok(urlOficialPlanalto(D13250));
  for (const u of ['https://exemplo.invalid/D13250.htm', 'http://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d13250.htm',
    'https://www.planalto.gov.br.exemplo.invalid/ccivil_03/_ato2023-2026/x.htm', 'https://www.planalto.gov.br/outra/pasta.htm']) assert.ok(!urlOficialPlanalto(u), u);
  // link no quadro para outro servidor
  const raiz = raizTemp();
  const r = await rodar(raiz, 'decreto-2027', '2026-12-28', { buscar: await buscadorCom('decreto-2027', {
    [Q2026]: { arquivo: 'quadro-2026-link-externo.htm', tipo: 'text/html' },
    'https://exemplo.invalid/D13250.htm': { arquivo: 'decreto-13250-2027-ficticio.htm' },
  }) });
  assert.deepEqual(r.aplicado, []);
  assert.ok(r.issues.some((i) => /aponta para fora do Planalto/.test(i.titulo)));
  // redirecionamento do decreto para outro servidor
  const r2 = await rodar(raiz, 'decreto-2027', '2026-12-28', { buscar: await buscadorCom('decreto-2027', {
    [D13250]: { arquivo: 'decreto-13250-2027-ficticio.htm', url_final: 'https://exemplo.invalid/d13250.htm' },
  }) });
  assert.deepEqual(r2.aplicado, []);
  assert.ok(r2.issues.some((i) => /redirecionou para fora do Planalto/.test(i.titulo)));
  // redirecionamento do quadro para outro servidor
  const r3 = await rodar(raiz, 'decreto-2027', '2026-12-28', { buscar: await buscadorCom('decreto-2027', {
    [Q2026]: { arquivo: 'quadro-2026-com-minimo-2027.htm', url_final: 'https://exemplo.invalid/_decretos2026.htm' },
  }) });
  assert.deepEqual(r3.aplicado, []);
  assert.ok(r3.issues.some((i) => /quadro de decretos de 2026 redirecionou/.test(i.titulo)), JSON.stringify(r3.issues.map((i) => i.titulo)) + JSON.stringify(r3.fontes.planalto_quadro_2026));
  const auto = existsSync(join(raiz, CAMINHO_AUTO)) ? lerAuto(raiz) : autoVazio();
  assert.ok(!(auto.vigencias.salario_minimo || []).some((v) => v.status === 'vigente'), 'só a projeção (previsto) do INPC');
  assert.equal(auto.vigencias.mei_das, undefined);
  rmSync(raiz, { recursive: true });
});

test('achados 2 e 14: mínimo aplicado só pelo BCB continua procurando o decreto e troca diário e hora pelos dele', async () => {
  const raiz = raizTemp();
  await rodar(raiz, 'so-bcb-2027', '2027-01-05');
  assert.deepEqual(vig(lerAuto(raiz), 'salario_minimo', '2027-01-01').valor, { mensal: 172000, diario: null, horario: null });
  // o motor mostra o diário como conta do app, com aviso
  const { obterMinimo } = await import('../js/motor/jornada.js');
  const r = await rodar(raiz, 'decreto-e-bcb-2027', '2027-01-06');
  assert.ok(r.fontes.planalto_quadro_2026, 'voltou a procurar o decreto');
  const m = vig(lerAuto(raiz), 'salario_minimo', '2027-01-01');
  assert.deepEqual(m.valor, { mensal: 172000, diario: 5734, horario: 782 });
  assert.match(m.fonte_url, /planalto\.gov\.br/);
  assert.equal(vig(lerAuto(raiz), 'mei_das', '2027-01-01').fonte_url, m.fonte_url);
  // decreto (R$ 1.720) diferente do que o BCB aplicou (R$ 1.730) → issue, nada trocado
  const raiz2 = raizTemp();
  await rodar(raiz2, 'so-bcb-2027', '2027-01-05', { buscar: await buscadorCom('so-bcb-2027', { [`${BCB}*`]: { arquivo: 'bcb-com-2027-diverge.json', tipo: 'application/json' } }) });
  assert.equal(vig(lerAuto(raiz2), 'salario_minimo', '2027-01-01').valor.mensal, 173000);
  const r2 = await rodar(raiz2, 'divergencia-2027', '2027-01-06');
  assert.ok(r2.issues.some((i) => /fontes divergem/.test(i.titulo)));
  assert.deepEqual(vig(lerAuto(raiz2), 'salario_minimo', '2027-01-01').valor, { mensal: 173000, diario: null, horario: null });
  assert.equal(obterMinimo('2026-06-01').diario, 5404);
  rmSync(raiz, { recursive: true });
  rmSync(raiz2, { recursive: true });
});

test('achado 2: sem diário do decreto, o motor calcula e avisa (conta do app)', async () => {
  const { obterMinimo } = await import('../js/motor/jornada.js');
  const m = obterMinimo('2026-06-01');
  assert.equal(m.diario, 5404);
  assert.equal(m.diario_derivado, false);
  // vigência sem diário (como o robô grava pela série do BCB)
  const auto = { formato: 1, gerado_em: '2027-01-05T12:00:00Z', vigencias: { salario_minimo: [{ valor: { mensal: 172000, diario: null, horario: null }, vigente_desde: '2027-01-01', vigente_ate: null, status: 'vigente', fonte_url: `${BCB}?formato=json`, lei: 'série 1619' }] } };
  const v = mesclado(auto, 'salario_minimo').find((x) => x.vigente_desde === '2027-01-01');
  assert.equal(v.status, 'vigente');
  assert.equal(v.valor.diario, null);
  // motor com um mínimo sem diário: conta do app (mensal ÷ 30) e aviso
  const sem = obterMinimo('2026-06-01', { salario_minimo: { mensal: 172000, diario: null, horario: null } });
  assert.equal(sem.diario, 5733);
  assert.equal(sem.diario_derivado, true);
  assert.ok(sem.alertas.some((a) => a.codigo === 'minimo_diario_derivado'));
  const { tabelaMinimo } = await import('../js/motor/salarios.js');
  const t = tabelaMinimo('2026-06-01', { overrides: { salario_minimo: { mensal: 172000, diario: null, horario: null } } });
  assert.equal(t.resultado.diario, 5733);
  assert.equal(t.resultado.diario_derivado, true);
});

test('achado 3: mudança do mínimo no meio do ano (série do BCB) abre issue e não aplica', async () => {
  const raiz = raizTemp();
  const r = await rodar(raiz, 'hoje', '2026-11-21', { buscar: await buscadorCom('hoje', { [`${BCB}*`]: { arquivo: 'bcb-2026-muda-em-maio.json', tipo: 'application/json' } }) });
  const i = r.issues.find((x) => /mudou no meio de 2026/.test(x.titulo));
  assert.ok(i, 'issue do meio do ano');
  assert.match(i.corpo, /05\/2026: BCB R\$ 1\.650,00, app R\$ 1\.621,00/);
  assert.deepEqual(r.aplicado, []);
  // série real (sem mudança no meio do ano): nenhuma issue
  const r2 = await rodar(raiz, 'hoje', '2026-11-22');
  assert.ok(!r2.issues.some((x) => /meio de/.test(x.titulo)));
  rmSync(raiz, { recursive: true });
});

test('achados 8 e 13: 401/403/408/429/451 numa página vigiada é erro passageiro, não mudança', async () => {
  const { respostaConta } = await import('../robo/robo.js');
  for (const st of [0, 401, 403, 408, 429, 451, 500, 503]) assert.equal(respostaConta({ ok: false, status: st }), false, String(st));
  for (const st of [200, 404, 410]) assert.equal(respostaConta({ ok: st === 200, status: st }), true, String(st));
  const raiz = raizTemp();
  await rodar(raiz, 'hoje', '2026-12-01');
  const antes = lerEstado(raiz);
  for (const st of [403, 429, 401]) {
    const r = await rodar(raiz, 'hoje', '2026-12-02', { buscar: await buscadorCom('hoje', {
      'https://www.al.sp.gov.br/*': { status: st }, 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas': { status: st },
    }) });
    assert.ok(!r.issues.some((i) => /mudou a página/.test(i.titulo)), `${st}: sem issue`);
    assert.equal(r.publicar, false, `${st}: sem commit`);
    const e = lerEstado(raiz);
    assert.equal(e.fontes.piso_SP.hash, antes.fontes.piso_SP.hash);
    assert.equal(e.fontes.irrf_indice.hash, antes.fontes.irrf_indice.hash);
    assert.ok(e.erros.some((x) => x.onde === 'piso_SP'));
  }
  const r3 = await rodar(raiz, 'hoje', '2026-12-03');
  assert.ok(!r3.issues.some((i) => /mudou a página/.test(i.titulo)), 'voltou ao normal: sem issue');
  assert.equal(r3.publicar, false);
  rmSync(raiz, { recursive: true });
});

test('achado 12: virada do ano não abre issue falsa do IRRF', async () => {
  const raiz = raizTemp();
  const irrf2027 = 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2027';
  const irrf2028 = 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2028';
  const b = await buscadorCom('hoje', { [irrf2027]: { arquivo: 'irrf-2026-real.html' }, [irrf2028]: { status: 404 } });
  await rodar(raiz, 'hoje', '2026-12-30', { buscar: b });
  const r1 = await rodar(raiz, 'hoje', '2026-12-31', { buscar: b });
  assert.equal(r1.publicar, false);
  const r2 = await rodar(raiz, 'hoje', '2027-01-01', { buscar: b });
  assert.ok(!r2.issues.some((i) => /mudou a página/.test(i.titulo)), JSON.stringify(r2.issues.map((i) => i.titulo)));
  const e = lerEstado(raiz);
  assert.ok(e.fontes.irrf_2027 && e.fontes.irrf_2028 && !e.fontes.irrf_2026, 'chaves com o ano; a do ano que saiu é apagada');
  assert.equal(e.fontes.irrf_2028.status, 404);
  const r3 = await rodar(raiz, 'hoje', '2027-01-02', { buscar: b });
  assert.equal(r3.publicar, false);
  // estado do formato antigo (irrf_ano_atual) não vira mudança
  const raiz2 = raizTemp();
  writeFileSync(join(raiz2, 'robo/estado.json'), JSON.stringify({ formato: 1, fontes: { irrf_ano_atual: { url: 'x', hash: 'velho', status: 200 } }, valores: {} }));
  const r4 = await rodar(raiz2, 'hoje', '2026-11-21');
  assert.ok(!r4.issues.some((i) => /mudou a página/.test(i.titulo)));
  assert.equal(lerEstado(raiz2).fontes.irrf_ano_atual, undefined);
  rmSync(raiz, { recursive: true });
  rmSync(raiz2, { recursive: true });
});

test('achado 9: gerado_em à noite em Brasília não vira o dia seguinte; selo nunca no futuro', async () => {
  const raiz = raizTemp();
  await executar({ raiz, agora: new Date('2027-01-01T01:00:00Z'), fixtures: join(FIX, 'decreto-2027'), token: null, log: silencio, diasCommit: 0 });
  const auto = lerAuto(raiz);
  assert.equal(auto.gerado_em, '2027-01-01T01:00:00.000Z');
  assert.equal(auto.gerado_em_brasilia, '2026-12-31');
  const { hojeBrasilia } = await import('../robo/robo.js');
  const ate = (d) => (d <= hojeBrasilia() ? d : hojeBrasilia());   // nunca depois de hoje
  assert.equal(dataDoRobo(auto), ate('2026-12-31'));
  assert.equal(dataDoRobo({ gerado_em: '2026-11-21T01:00:00Z' }), '2026-11-20', 'sem o campo novo, converte para Brasília');
  assert.equal(dataDoRobo({ gerado_em: '2027-01-01T01:00:00Z' }), ate('2026-12-31'));
  assert.equal(dataDoRobo({ gerado_em_brasilia: '2999-01-01' }) <= new Date().toISOString().slice(0, 10), true, 'nunca no futuro');
  rmSync(raiz, { recursive: true });
});

test('achado 11: valores absurdos no arquivo do robô não entram na conta (conferência por parâmetro)', () => {
  const pl = 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d13250.htm';
  const base = { vigente_ate: null, status: 'vigente', lei: 'teste' };
  const lixo = { formato: 1, gerado_em: '2026-12-20T12:00:00Z', vigencias: {
    salario_minimo: [{ ...base, valor: { mensal: 100 }, vigente_desde: '2027-01-01', fonte_url: pl }],
    inss_empregado: [{ ...base, valor: { faixas: [{ ate: 5, aliquota_pct: 99 }], teto: 1 }, vigente_desde: '2027-01-01', fonte_url: pl }],
    mei_das: [{ ...base, valor: 'lixo', vigente_desde: '2027-01-01', fonte_url: pl }],
  } };
  const recusadas = problemasAuto(PARAMETROS_MANUAIS, lixo);
  assert.deepEqual(recusadas.map((x) => x.chave).sort(), ['inss_empregado', 'mei_das', 'salario_minimo']);
  assert.equal(mesclado(lixo, 'salario_minimo').find((v) => v.vigente_desde === '2027-01-01').status, 'previsto', 'fica o previsto manual');
  assert.equal(mesclado(lixo, 'inss_empregado').length, 1);
  assert.equal(mesclado(lixo, 'mei_das').length, 1);
  // MEI que não é 5% do mínimo, fonte fora do gov.br e mínimo subindo mais de 15%
  const torto = { formato: 1, vigencias: {
    salario_minimo: [{ ...base, valor: { mensal: 172000, diario: 5734, horario: 782 }, vigente_desde: '2027-01-01', fonte_url: pl }],
    mei_das: [{ ...base, valor: { inss: 9999, icms: 100, iss: 500 }, vigente_desde: '2027-01-01', fonte_url: pl }],
  } };
  assert.deepEqual(problemasAuto(PARAMETROS_MANUAIS, torto).map((x) => x.chave), ['mei_das']);
  const fora = { formato: 1, vigencias: { salario_minimo: [{ ...base, valor: { mensal: 172000, diario: 5734, horario: 782 }, vigente_desde: '2027-01-01', fonte_url: 'https://exemplo.invalid/d.htm' }] } };
  assert.match(problemasAuto(PARAMETROS_MANUAIS, fora)[0].problemas.join(), /fora do gov\.br/);
  const alto = { formato: 1, vigencias: { salario_minimo: [{ ...base, valor: { mensal: 200000, diario: 6667, horario: 909 }, vigente_desde: '2027-01-01', fonte_url: pl }] } };
  assert.equal(problemasAuto(PARAMETROS_MANUAIS, alto).length, 1);
  // se o mínimo cai, os derivados dele caem junto
  const semMin = { formato: 1, vigencias: { ...torto.vigencias, salario_minimo: alto.vigencias.salario_minimo, mei_das: [{ ...base, valor: { inss: 10000, icms: 100, iss: 500 }, vigente_desde: '2027-01-01', fonte_url: pl }] } };
  assert.deepEqual(problemasAuto(PARAMETROS_MANUAIS, semMin).map((x) => x.chave).sort(), ['mei_das', 'salario_minimo']);
  // o que o robô grava nos cenários passa na conferência
  assert.deepEqual(problemasAuto(PARAMETROS_MANUAIS, lerAuto(RAIZ)), []);
});

test('achado 11: tudo o que o robô grava nos cenários passa na conferência por parâmetro', async () => {
  const raiz = raizTemp();
  await rodar(raiz, 'decreto-2027', '2026-12-28');
  assert.deepEqual(problemasAuto(PARAMETROS_MANUAIS, lerAuto(raiz)), []);
  await rodar(raiz, 'decreto-e-bcb-2027', '2027-01-05');
  await rodar(raiz, 'inss-2027', '2027-01-12');
  const auto = lerAuto(raiz);
  assert.deepEqual(problemasAuto(PARAMETROS_MANUAIS, auto), []);
  assert.deepEqual(Object.keys(auto.vigencias).sort(), ['autonomo', 'autonomo_retencao_empresa', 'inss_empregado', 'mei_das', 'salario_familia', 'salario_minimo']);
  rmSync(raiz, { recursive: true });
});

test('achado 3: a série real do BCB (baixada em 21/11/2026) mostra as MPs de 2020 e 2023 mês a mês', async () => {
  const { lerSerieMinimo, lerSerieMinimoMeses } = await import('../robo/fontes/series.js');
  const txt = readFileSync(join(FIX, 'comum/bcb-2017-2026-real.json'), 'utf8');
  const meses = lerSerieMinimoMeses(txt);
  assert.equal(meses['2020-01'], 103900);
  assert.equal(meses['2020-02'], 104500);   // MP 919/2020
  assert.equal(meses['2023-04'], 130200);
  assert.equal(meses['2023-05'], 132000);   // MP 1.172/2023
  assert.equal(lerSerieMinimo(txt)[2020], 103900, 'janeiro sozinho não vê a mudança');
});
