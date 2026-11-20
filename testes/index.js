// Faz `node --test testes/` funcionar no Node 22: com a pasta como argumento, o Node carrega
// testes/index.js. Este arquivo só importa cada testes/*.test.mjs. `node --test` (sem argumento)
// não pega este arquivo, porque o nome não segue o padrão *.test.*.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const arquivos = fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.mjs')).sort();
(async () => {
  for (const f of arquivos) await import(pathToFileURL(path.join(__dirname, f)).href);
})();
