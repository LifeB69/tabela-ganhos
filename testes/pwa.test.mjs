// PWA: o sw.js guarda TODOS os arquivos do app, a versão bate com a do app e o manifest está completo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSAO_APP } from '../js/dados/config.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const sw = readFileSync(join(RAIZ, 'sw.js'), 'utf8');

function listar(pasta, filtro) {
  const saida = [];
  for (const nome of readdirSync(join(RAIZ, pasta))) {
    const caminho = join(RAIZ, pasta, nome);
    if (statSync(caminho).isDirectory()) saida.push(...listar(relative(RAIZ, caminho), filtro));
    else if (filtro.test(nome)) saida.push(`./${relative(RAIZ, caminho).split('\\').join('/')}`);
  }
  return saida;
}

function filesDoSw() {
  const bloco = sw.slice(sw.indexOf('const FILES = ['), sw.indexOf('];', sw.indexOf('const FILES = [')));
  return [...bloco.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

test('sw.js lista todos os arquivos do app (e só arquivos que existem)', () => {
  const lista = filesDoSw();
  assert.equal(new Set(lista).size, lista.length, 'há arquivo repetido em FILES');
  const esperado = [
    './', './index.html', './manifest.webmanifest',
    ...readdirSync(RAIZ).filter((n) => n.endsWith('.png')).map((n) => `./${n}`),
    ...listar('css', /\.css$/), ...listar('js', /\.js$/), ...listar('dados', /\.js$/), ...listar('fontes', /\.woff2$/),
  ].sort();
  assert.deepEqual([...lista].sort(), esperado);
});

test('versão do cache = versão do app', () => {
  const m = sw.match(/const VERSAO = '([^']+)'/);
  assert.ok(m, 'sw.js sem VERSAO');
  assert.equal(m[1], VERSAO_APP);
});

test('sw.js: rede primeiro com no-cache, fontes do cache, nada de fora', () => {
  assert.match(sw, /cache: 'no-cache'/);
  assert.match(sw, /\.woff2'\)\) \{ e\.respondWith\(cachePrimeiro/);
  assert.match(sw, /url\.origin !== self\.location\.origin\) return/);
});

test('manifest: campos da v2', () => {
  const m = JSON.parse(readFileSync(join(RAIZ, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.name, 'Tabela de Ganhos');
  assert.equal(m.short_name, 'Ganhos');
  assert.equal(m.start_url, './#calcular');
  assert.equal(m.display, 'standalone');
  assert.match(m.theme_color, /^#[0-9A-F]{6}$/i);
  assert.match(m.background_color, /^#[0-9A-F]{6}$/i);
  for (const i of m.icons) statSync(join(RAIZ, i.src));
  assert.ok(m.icons.some((i) => i.purpose === 'maskable'));
  assert.deepEqual(m.shortcuts.map((s) => s.url), ['./#calcular', './#tabela', './#salvos']);
});

test('index.html: CSP só do próprio site e nenhum recurso externo', () => {
  const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(csp);
  assert.doesNotMatch(csp[1], /https?:|\*|unsafe/);
  assert.doesNotMatch(html, /(src|href)="(https?:)?\/\//);
  // CSS não carrega nada de fora (fontes e imagens são do próprio site)
  for (const f of [...listar('css', /\.css$/)]) {
    const css = readFileSync(join(RAIZ, f), 'utf8');
    assert.doesNotMatch(css, /url\(\s*['"]?(https?:)?\/\//, f);
    assert.doesNotMatch(css, /@import/, f);
  }
  // JS: nenhum fetch, import ou script de fora
  for (const f of [...listar('js', /\.js$/), ...listar('dados', /\.js$/)]) {
    const js = readFileSync(join(RAIZ, f), 'utf8');
    assert.doesNotMatch(js, /\bfetch\(\s*['"`]https?:/, f);
    assert.doesNotMatch(js, /import\s*\(?\s*['"`]https?:/, f);
    assert.doesNotMatch(js, /from\s+['"]https?:/, f);
  }
});
