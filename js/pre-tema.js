// Tabela de Ganhos v2 — aplica a aparência ANTES da primeira pintura (carregado no <head>, sem defer).
// Lê o espelho síncrono 'tg2-aparencia' (o app grava ali ao salvar a config, que mora no IndexedDB).
// Sem espelho, aproveita o tema da v1 ('tg-theme'). A querystring (?visual=c&tema=escuro...) serve
// para testes e vale só nesta abertura, sem salvar.
(function () {
  'use strict';
  var raiz = document.documentElement;
  var OPCOES = {
    visual: ['a', 'b', 'c'],
    tema: ['auto', 'claro', 'escuro'],
    letra: ['normal', 'grande'],
    contraste: ['normal', 'alto'],
    movimento: ['auto', 'reduzido']
  };
  var PADRAO = { visual: 'a', tema: 'auto', letra: 'normal', contraste: 'normal', movimento: 'auto' };
  var pref = {};
  try {
    var espelho = window.localStorage.getItem('tg2-aparencia');
    if (espelho) {
      var lido = JSON.parse(espelho);
      if (lido && typeof lido === 'object') pref = lido;
    } else {
      var v1 = window.localStorage.getItem('tg-theme');
      if (v1 === 'light') pref.tema = 'claro';
      else if (v1 === 'dark') pref.tema = 'escuro';
    }
  } catch (e) { /* janela anônima ou armazenamento bloqueado: segue o padrão */ }
  try {
    var q = new URLSearchParams(window.location.search);
    for (var k in OPCOES) if (q.has(k)) pref[k] = q.get(k);
  } catch (e) { /* navegador antigo */ }
  for (var chave in OPCOES) {
    var v = pref[chave];
    if (OPCOES[chave].indexOf(v) < 0) v = PADRAO[chave];
    raiz.setAttribute('data-' + chave, v);
  }
})();
