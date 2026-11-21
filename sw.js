// Tabela de Ganhos v2 — service worker: guarda o app no aparelho para funcionar sem internet.
//
// Estratégia:
// - Páginas e arquivos do app: rede primeiro (fetch com cache 'no-cache', sempre a versão nova quando
//   há internet). Sem internet, ou se a rede demorar mais que ESPERA_REDE_MS, usa a cópia guardada.
// - Fontes (.woff2): cache primeiro (não mudam entre versões).
// - Nada de fora do site é pedido nem guardado (o app não usa recurso externo).
//
// Ao publicar uma versão: suba VERSAO aqui e VERSAO_APP em js/dados/config.js (o teste
// testes/sw.test.mjs confere que são iguais e que FILES lista todos os arquivos do app).
const VERSAO = '2.0.0';
const CACHE = `ganhos-${VERSAO}`;
const ESPERA_REDE_MS = 4000;

const FILES = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png',
  // CSS
  './css/tokens.css', './css/base.css', './css/componentes.css', './css/impressao.css',
  './css/telas/calcular.css', './css/telas/tabela.css', './css/telas/salvos.css', './css/telas/leis.css', './css/telas/mais.css',
  // Casca, dados e componentes
  './js/pre-tema.js', './js/app.js', './js/compartilhar.js',
  './js/dados/armazem.js', './js/dados/config.js',
  './js/ui/index.js', './js/ui/el.js', './js/ui/icones.js', './js/ui/basicos.js', './js/ui/campos.js',
  './js/ui/resultado.js', './js/ui/sobreposicoes.js',
  // Motor e parâmetros da lei
  './js/motor/index.js', './js/motor/parametros.js', './js/motor/dinheiro.js', './js/motor/comum.js', './js/motor/jornada.js',
  './js/motor/inss.js', './js/motor/irrf.js', './js/motor/porHora.js', './js/motor/diarista.js', './js/motor/domestico.js',
  './js/motor/salarios.js', './js/motor/alertas.js',
  './dados/parametros.js', './dados/parametros-auto.js', './dados/leis.js',
  // Telas
  './js/telas/calcular.js',
  './js/telas/calcular/util.js', './js/telas/calcular/porHora.js', './js/telas/calcular/diarista.js',
  './js/telas/calcular/domestico.js', './js/telas/calcular/questionario.js', './js/telas/calcular/acoes.js',
  './js/telas/tabela.js',
  './js/telas/salvos.js', './js/telas/salvos/util.js', './js/telas/salvos/backup.js',
  './js/telas/leis.js', './js/telas/leis/texto.js',
  './js/telas/mais.js',
  './js/telas/mais/util.js', './js/telas/mais/aparencia.js', './js/telas/mais/preferencias.js',
  './js/telas/mais/legal.js', './js/telas/mais/dados.js', './js/telas/mais/sobre.js',
  // Fontes
  './fontes/barlow-400.woff2', './fontes/barlow-500.woff2', './fontes/barlow-600.woff2',
  './fontes/barlow-condensed-600.woff2', './fontes/barlow-condensed-700.woff2',
  './fontes/libre-franklin-var.woff2', './fontes/noto-sans-var.woff2',
  './fontes/red-hat-mono-var.woff2', './fontes/red-hat-text-var.woff2',
];

const PAGINA = new URL('./index.html', self.location).href;
const RAIZ_PATH = new URL('./', self.location).pathname;

/** Navegação da casca do app: a raiz do site ('./') ou './index.html' (com qualquer ?query ou #hash). */
function ehCasca(url) {
  return url.pathname === RAIZ_PATH || url.pathname === `${RAIZ_PATH}index.html`;
}

/** Só uma página HTML de verdade pode ir para a chave da casca (evita guardar .md ou outra página no lugar). */
function ehHtml(res) {
  return /^text\/html\b/i.test(res.headers.get('content-type') || '');
}

self.addEventListener('install', (e) => {
  // Tudo ou nada: se faltar um arquivo, a versão anterior continua valendo (nunca fica meio app).
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter((k) => k.startsWith('ganhos-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
    // Avisa as janelas abertas: a casca compara com a versão dela e mostra "Nova versão disponível".
    const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    janelas.forEach((j) => j.postMessage({ tipo: 'sw-ativo', versao: VERSAO }));
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.tipo === 'versao' && e.source) e.source.postMessage({ tipo: 'sw-versao', versao: VERSAO });
});

function guardar(chave, resposta) {
  if (!resposta || !resposta.ok || resposta.type !== 'basic') return;
  const copia = resposta.clone();
  caches.open(CACHE).then((c) => c.put(chave, copia)).catch(() => {});
}

async function daCopia(req, navegacao) {
  if (navegacao) return (await caches.match(PAGINA)) || caches.match(new URL('./', self.location).href);
  return caches.match(req);
}

/** Rede primeiro; cópia guardada sem internet, com erro do servidor ou se a rede demorar demais. */
async function redePrimeiro(req, navegacao) {
  const chave = navegacao ? PAGINA : req;
  const daRede = fetch(req, { cache: 'no-cache' }).then((res) => {
    if (res.ok && (!navegacao || ehHtml(res))) guardar(chave, res);
    return res;
  });
  daRede.catch(() => {});   // a falha é tratada abaixo; aqui só evita o aviso de promessa sem tratamento
  const copia = await daCopia(req, navegacao);
  if (!copia) return daRede.catch(() => Response.error());
  let timer;
  const demorou = new Promise((ok) => { timer = setTimeout(() => ok(null), ESPERA_REDE_MS); });
  try {
    const res = await Promise.race([daRede, demorou]);
    if (res && res.ok) return res;
    return copia;   // demorou (a rede continua e atualiza a cópia), ou o servidor respondeu com erro
  } catch {
    return copia;   // sem internet
  } finally {
    clearTimeout(timer);
  }
}

async function cachePrimeiro(req) {
  const copia = await caches.match(req);
  if (copia) return copia;
  const res = await fetch(req);
  guardar(req, res);
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // o app não usa nada de fora
  if (url.pathname.includes('/testes/')) return;      // ferramentas de teste: sempre da rede
  if (url.pathname.endsWith('.woff2')) { e.respondWith(cachePrimeiro(req)); return; }
  const navegacao = req.mode === 'navigate';
  // Outras páginas publicadas (docs/, design/, legado/, README): direto da rede, sem tocar no cache.
  // Antes, qualquer navegação era guardada com a chave de index.html e trocava a casca guardada.
  if (navegacao && !ehCasca(url)) return;
  e.respondWith(redePrimeiro(req, navegacao));
});
