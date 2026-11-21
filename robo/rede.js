// Busca de páginas: fetch nativo com User-Agent identificável, tempo-limite e tentativas.
// Nunca lança exceção: devolve { ok, status, url, url_final, tipo, bytes, texto, erro }.
// Com fixtures, lê respostas gravadas (rotas.json) e nada sai para a rede.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { USER_AGENT, TIMEOUT_MS, TENTATIVAS, ESPERA_ENTRE_TENTATIVAS_MS } from './config.js';

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

/** Charset do Content-Type ou do <meta> do próprio HTML. */
function charsetDe(tipo, bytes) {
  const m = /charset=["']?([\w-]+)/i.exec(tipo || '');
  if (m) return m[1].toLowerCase();
  const inicio = Buffer.from(bytes.subarray(0, 4096)).toString('latin1');
  const m2 = /<meta[^>]+charset=["']?([\w-]+)/i.exec(inicio);
  return m2 ? m2[1].toLowerCase() : null;
}

/** Decodifica respeitando o charset; páginas do Planalto vêm em windows-1252. */
export function decodificar(bytes, tipo) {
  let cs = charsetDe(tipo, bytes) || 'utf-8';
  if (cs === 'iso-8859-1' || cs === 'latin1' || cs === 'us-ascii') cs = 'windows-1252';
  let texto;
  try { texto = new TextDecoder(cs).decode(bytes); } catch { texto = new TextDecoder('utf-8').decode(bytes); cs = 'utf-8'; }
  // Declarou UTF-8 mas veio em windows-1252 (acentos viram U+FFFD): decodifica de novo.
  if (cs === 'utf-8' && (texto.match(/�/g) || []).length > 3) {
    texto = new TextDecoder('windows-1252').decode(bytes);
  }
  return texto;
}

function respostaErro(url, erro, status = 0) {
  return { ok: false, status, url, url_final: url, tipo: '', bytes: null, texto: '', erro };
}

/** Buscador real (rede). */
export function criarBuscadorRede({ tentativas = TENTATIVAS, timeoutMs = TIMEOUT_MS, esperaMs = ESPERA_ENTRE_TENTATIVAS_MS, log = () => {} } = {}) {
  return async function buscar(url, { aceitar = 'text/html,application/json;q=0.9,*/*;q=0.5' } = {}) {
    let ultimo = respostaErro(url, 'não tentado');
    for (let i = 1; i <= tentativas; i++) {
      try {
        const res = await fetch(url, {
          headers: { 'user-agent': USER_AGENT, accept: aceitar, 'accept-language': 'pt-BR,pt;q=0.9' },
          redirect: 'follow',
          signal: AbortSignal.timeout(timeoutMs),
        });
        const bytes = new Uint8Array(await res.arrayBuffer());
        const tipo = res.headers.get('content-type') || '';
        const r = { ok: res.ok, status: res.status, url, url_final: res.url || url, tipo, bytes, texto: decodificar(bytes, tipo), erro: res.ok ? null : `HTTP ${res.status}` };
        if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) return r;
        ultimo = r;   // 5xx ou 429: tenta de novo
      } catch (e) {
        ultimo = respostaErro(url, (e && e.cause && e.cause.code) || (e && e.name === 'TimeoutError' ? 'tempo esgotado' : String(e && e.message || e)));
      }
      log(`  tentativa ${i}/${tentativas} falhou para ${url}: ${ultimo.erro}`);
      if (i < tentativas) await esperar(esperaMs * i);
    }
    return ultimo;
  };
}

/**
 * Buscador de fixtures: <dir>/rotas.json = { "rotas": [ { "url", "prefixo"?, "arquivo"?, "status"?,
 * "tipo"?, "url_final"?, "erro"? } ] }. URL sem rota = erro de rede (como sem internet).
 */
export function criarBuscadorFixtures(dir) {
  const arq = join(dir, 'rotas.json');
  const rotas = existsSync(arq) ? JSON.parse(readFileSync(arq, 'utf8')).rotas || [] : [];
  return async function buscar(url) {
    const rota = rotas.find((r) => (r.prefixo ? url.startsWith(r.url) : url === r.url));
    if (!rota) return respostaErro(url, 'sem fixture (rede desligada)');
    if (rota.erro) return respostaErro(url, rota.erro, rota.status || 0);
    const bytes = rota.arquivo ? new Uint8Array(readFileSync(join(dir, rota.arquivo))) : new Uint8Array();
    const status = rota.status || 200;
    const tipo = rota.tipo || 'text/html; charset=utf-8';
    return { ok: status >= 200 && status < 300, status, url, url_final: rota.url_final || url, tipo, bytes, texto: decodificar(bytes, tipo), erro: status >= 200 && status < 300 ? null : `HTTP ${status}` };
  };
}
