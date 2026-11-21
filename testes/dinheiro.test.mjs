import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDinheiro, formatarBRL, porExtenso, dividirArredondando, aplicarPct, arredondarPara } from '../js/motor/index.js';

test('parse de dinheiro aceita os formatos brasileiros', () => {
  assert.equal(parseDinheiro('1.621,00'), 162100);
  assert.equal(parseDinheiro('1621'), 162100);
  assert.equal(parseDinheiro('R$ 1621'), 162100);
  assert.equal(parseDinheiro('R$ 1.621,00'), 162100);
  assert.equal(parseDinheiro('1621,5'), 162150);
  assert.equal(parseDinheiro('1621.50'), 162150);
  assert.equal(parseDinheiro('1.621'), 162100);
  assert.equal(parseDinheiro('1.000.000'), 100000000);
  assert.equal(parseDinheiro('7,37'), 737);
  assert.equal(parseDinheiro(',5'), 50);
  assert.equal(parseDinheiro(12.5), 1250);
  assert.equal(parseDinheiro('0,005'), 1);
});

test('parse de dinheiro devolve null para lixo e vazio', () => {
  for (const v of ['', '   ', 'abc', '1,2,3', '1.62.1', null, undefined, 'R$']) {
    assert.equal(parseDinheiro(v), null, String(v));
  }
});

test('formatação em reais', () => {
  assert.equal(formatarBRL(162100), 'R$ 1.621,00');
  assert.equal(formatarBRL(5), 'R$ 0,05');
  assert.equal(formatarBRL(-12158), '-R$ 121,58');
  assert.equal(formatarBRL(100000000), 'R$ 1.000.000,00');
  assert.equal(formatarBRL(162100, { simbolo: false }), '1.621,00');
});

test('arredondamento meio para cima e porcentagem sem erro de ponto flutuante', () => {
  assert.equal(dividirArredondando(121575, 1000), 122);
  assert.equal(dividirArredondando(121574, 1000), 122);
  assert.equal(dividirArredondando(121499, 1000), 121);
  assert.equal(aplicarPct(162100, 7.5), 12158); // 121,575 -> 121,58
  assert.equal(aplicarPct(162100, 0.8), 1297); // 12,968 -> 12,97
  assert.equal(aplicarPct(162100, 3.2), 5187); // 51,872 -> 51,87
  assert.equal(arredondarPara(12349, 50), 12350);
  assert.equal(arredondarPara(12349, 0), 12349);
});

test('valor por extenso', () => {
  assert.equal(porExtenso(162100), 'mil seiscentos e vinte e um reais');
  assert.equal(porExtenso(100), 'um real');
  assert.equal(porExtenso(48000), 'quatrocentos e oitenta reais');
  assert.equal(porExtenso(12158), 'cento e vinte e um reais e cinquenta e oito centavos');
  assert.equal(porExtenso(200000000), 'dois milhões de reais');
  assert.equal(porExtenso(110000), 'mil e cem reais');
  assert.equal(porExtenso(1), 'um centavo');
});
