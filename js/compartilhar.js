// Tabela de Ganhos v2 — compartilhar: link com o cálculo preenchido, texto de WhatsApp e cópia.
// O link leva SÓ números (modo, valores, dias, data): nunca título, notas, nomes, CPF ou chave Pix.
// Formato: <endereço do app>#c=<base64url de JSON {v:1, m:modo, e:entrada, d:'AAAA-MM-DD'}>
import { formatarBRL, dataValida, UFS } from './motor/index.js';
import { dataNaFaixa } from './dados/config.js';

export const VERSAO_LINK = 1;
export const MODOS_LINK = ['porHora', 'inverso', 'diarista', 'domestico'];
const LIMITE_HASH = 2000;          // caracteres do trecho depois de "#c="
const MAX_CHAVES = 30;
const MAX_LISTA = 31;
const CHAVE_OK = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;
const NUMERO_TEXTO = /^-?[0-9]{1,13}([.,][0-9]{1,13})*$/;   // "1621", "1.621,00", "4,5"

/** Textos que não são números mas também não identificam ninguém: só estes valores entram no link. */
const TEXTOS_PERMITIDOS = Object.freeze({
  tipo: ['mensalista', 'horista'],
  uf: UFS,
  grupoPR: ['I', 'II', 'III', 'IV'],
  unidade: ['hora', 'dia', 'semana', 'mes', 'ano'],
  metodo: ['legal', 'calendario'],
});

function ehObjeto(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function valorPermitido(chave, v) {
  if (typeof v === 'number') return Number.isFinite(v) && Math.abs(v) < 1e13 ? v : undefined;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return undefined;
    if (s.length <= 30 && NUMERO_TEXTO.test(s)) return s;
    if (chave === 'mes' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s)) return s;
    const lista = TEXTOS_PERMITIDOS[chave];
    if (lista && lista.includes(s)) return s;
    return undefined;
  }
  return undefined;
}

/** Filtra a entrada: fica só o que é número, sim/não, lista de números ou um texto da lista permitida. */
export function entradaSoNumerica(entrada) {
  const saida = {};
  if (!ehObjeto(entrada)) return saida;
  let n = 0;
  for (const [k, v] of Object.entries(entrada)) {
    if (n >= MAX_CHAVES) break;
    if (!CHAVE_OK.test(k)) continue;
    if (Array.isArray(v)) {
      const lista = v.slice(0, MAX_LISTA).filter((x) => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) < 1e6);
      if (lista.length) { saida[k] = lista; n++; }
      continue;
    }
    const p = valorPermitido(k, v);
    if (p !== undefined) { saida[k] = p; n++; }
  }
  return saida;
}

// ───────────── base64url de UTF-8 ─────────────
function paraBase64url(texto) {
  const bytes = new TextEncoder().encode(texto);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function deBase64url(b64) {
  if (!/^[A-Za-z0-9_-]+$/.test(b64)) throw new Error('caracteres inválidos');
  const normal = b64.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(normal + '==='.slice((normal.length + 3) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/** Endereço do app sem hash nem querystring (o link funciona em qualquer endereço onde o app esteja). */
function enderecoBase() {
  try { return `${location.origin}${location.pathname}`; } catch { return ''; }
}

/**
 * Gera o link do cálculo.
 * @param {{ modo: string, entrada: object, data?: string }} estado
 * @returns {string} URL completa com #c=...
 */
export function gerarLink({ modo, entrada, data } = {}) {
  if (!MODOS_LINK.includes(modo)) throw new Error('Modo inválido para compartilhar.');
  const pacote = { v: VERSAO_LINK, m: modo, e: entradaSoNumerica(entrada) };
  if (dataNaFaixa(data)) pacote.d = data;
  return `${enderecoBase()}#c=${paraBase64url(JSON.stringify(pacote))}`;
}

/**
 * Lê um link (ou só o hash) e valida tudo. Nunca lança erro.
 * @param {string} hash ex.: location.hash ("#c=eyJ2Ijox...") ou a URL inteira
 * @returns {{ ok: true, estado: { modo, entrada, data } } | { ok: false, erro: string }}
 */
export function lerLink(hash) {
  const falha = (erro) => ({ ok: false, erro });
  if (typeof hash !== 'string') return falha('Link vazio.');
  const i = hash.indexOf('#c=');
  const codigo = i >= 0 ? hash.slice(i + 3) : hash.startsWith('c=') ? hash.slice(2) : '';
  if (!codigo) return falha('Este link não tem um cálculo.');
  if (codigo.length > LIMITE_HASH) return falha('O link está grande demais.');
  let pacote;
  try { pacote = JSON.parse(deBase64url(codigo)); } catch { return falha('O link está incompleto ou foi alterado.'); }
  if (!ehObjeto(pacote)) return falha('O link está incompleto ou foi alterado.');
  if (pacote.v !== VERSAO_LINK) return falha('Este link foi feito por outra versão do app.');
  if (!MODOS_LINK.includes(pacote.m)) return falha('O link pede um modo de cálculo que não existe.');
  if (!ehObjeto(pacote.e)) return falha('O link está incompleto ou foi alterado.');
  const extras = Object.keys(pacote).filter((k) => !['v', 'm', 'e', 'd'].includes(k));
  if (extras.length) return falha('O link tem dados que este app não usa.');
  const entrada = entradaSoNumerica(pacote.e);
  if (Object.keys(entrada).length !== Object.keys(pacote.e).length) return falha('O link tem dados que este app não aceita.');
  // Só a faixa que o app usa (2000 a 2099): uma data antiga faria o motor falhar com "Não deu para calcular".
  const data = pacote.d === undefined ? null : dataNaFaixa(pacote.d) ? pacote.d : undefined;
  if (data === undefined) return falha('A data do link é inválida.');
  return { ok: true, estado: { modo: pacote.m, entrada, data } };
}

/**
 * Monta o texto pronto para WhatsApp (texto puro; o WhatsApp entende *negrito*).
 * @param {{ titulo?: string, linhas: Array<{ rotulo: string, valor_centavos?: number, texto?: string }>,
 *           data?: string, link?: string, nota?: string }} resultado
 * @returns {string}
 */
export function textoWhatsApp({ titulo = 'Cálculo', linhas = [], data = null, link = null, nota = null } = {}) {
  const limpo = (t) => String(t ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
  const partes = [`*${limpo(titulo) || 'Cálculo'}*`];
  if (dataValida(data)) { const [a, m, d] = data.split('-'); partes.push(`Data: ${d}/${m}/${a}`); }
  for (const l of Array.isArray(linhas) ? linhas.slice(0, 30) : []) {
    const valor = Number.isFinite(l && l.valor_centavos) ? formatarBRL(l.valor_centavos) : limpo(l && l.texto);
    if (l && l.rotulo) partes.push(`${limpo(l.rotulo)}: ${valor}`);
  }
  if (nota) partes.push(limpo(nota));
  if (link) partes.push('', `Ver a conta: ${link}`);
  partes.push('', 'Estimativa educativa; não substitui contador, advogado nem o eSocial. Feito na Tabela de Ganhos.');
  return partes.join('\n');
}

/** Link do WhatsApp com o texto (abre o app ou o site do WhatsApp; nada é enviado sem a pessoa tocar em enviar). */
export function linkWhatsApp(texto) {
  return `https://wa.me/?text=${encodeURIComponent(String(texto))}`;
}

/**
 * Copia texto para a área de transferência. Usa navigator.clipboard e, se falhar, um textarea escondido.
 * @returns {Promise<boolean>} true se copiou
 */
export async function copiar(texto) {
  const t = String(texto ?? '');
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(t); return true; }
  } catch { /* cai na reserva */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = t;
    ta.setAttribute('readonly', '');
    ta.className = 'sr';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return !!ok;
  } catch { return false; }
}

/** Usa o menu de compartilhar do aparelho quando existe; senão copia. @returns {Promise<'compartilhado'|'copiado'|'cancelado'|'falhou'>} */
export async function compartilharNativo({ titulo, texto, url }) {
  try {
    if (navigator.share) { await navigator.share({ title: titulo, text: texto, url }); return 'compartilhado'; }
  } catch (e) { if (e && e.name === 'AbortError') return 'cancelado'; }
  return (await copiar(url ? `${texto}\n${url}` : texto)) ? 'copiado' : 'falhou';
}
