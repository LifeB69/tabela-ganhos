// Utilidades de texto: HTML → texto, dinheiro brasileiro → centavos, normalização para hash.
import { createHash } from 'node:crypto';

const ENTIDADES = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ordm: 'º', ordf: 'ª', deg: '°', sect: '§',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  atilde: 'ã', otilde: 'õ', Atilde: 'Ã', Otilde: 'Õ', acirc: 'â', ecirc: 'ê', ocirc: 'ô', Acirc: 'Â', Ecirc: 'Ê', Ocirc: 'Ô',
  agrave: 'à', Agrave: 'À', ccedil: 'ç', Ccedil: 'Ç', uuml: 'ü', ndash: '–', mdash: '—', hellip: '…', bull: '•', middot: '·', laquo: '«', raquo: '»',
};

export function decodificarEntidades(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return Object.prototype.hasOwnProperty.call(ENTIDADES, e) ? ENTIDADES[e] : m;
  });
}

/** Tira scripts, estilos, comentários e tags; decodifica entidades; junta espaços. */
export function htmlParaTexto(html) {
  return decodificarEntidades(String(html || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[\s ]+/g, ' ')
    .trim();
}

/** Sem acentos e em minúsculas, para comparar ementas. */
export function semAcento(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** "1.621,00" → 162100 (centavos). null se não for dinheiro. */
export function reaisParaCentavos(s) {
  const m = /^\s*(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})\s*$/.exec(String(s || ''));
  if (!m) return null;
  return Number(m[1].replace(/\./g, '')) * 100 + Number(m[2]);
}

/** Todos os valores "R$ 1.234,56" (ou só "1.234,56") de um trecho, em centavos. */
export function valoresEmReais(trecho, { exigirCifrao = true } = {}) {
  const re = exigirCifrao ? /R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/g : /(\d{1,3}(?:\.\d{3})*,\d{2})/g;
  return [...String(trecho).matchAll(re)].map((m) => reaisParaCentavos(m[1]));
}

/** Pedaço do HTML entre a abertura de um elemento com o id/tag dado e o fim provável (heurística). */
export function conteudoPrincipal(html) {
  const s = String(html || '');
  const marcas = [
    [/<div[^>]+id=["']content-core["'][^>]*>/i, /<div[^>]+id=["']viewlet-below-content-body["']/i],   // gov.br (Plone)
    [/<main\b[^>]*>/i, /<\/main>/i],
    [/<article\b[^>]*>/i, /<\/article>/i],
    [/<body\b[^>]*>/i, /<\/body>/i],
  ];
  for (const [ini, fim] of marcas) {
    const a = ini.exec(s);
    if (!a) continue;
    const resto = s.slice(a.index + a[0].length);
    const b = fim.exec(resto);
    return b ? resto.slice(0, b.index) : resto;
  }
  return s;
}

/**
 * Resumo normalizado de uma página para vigiar mudanças: só o conteúdo principal, sem scripts,
 * espaços repetidos e marcas de "Atualizado em / Publicado em / Última modificação".
 */
export function resumoNormalizado(html) {
  return htmlParaTexto(conteudoPrincipal(html))
    .replace(/(atualizado|publicado|modificado|última modificação|ultima modificacao)\s*(em|:)?\s*\d{1,2}\/\d{1,2}\/\d{2,4}(\s*(às|as)?\s*\d{1,2}h\d{2}|\s*\d{1,2}:\d{2})?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sha256(dados) {
  return createHash('sha256').update(dados).digest('hex');
}

/** Linhas de tabela (<tr>) com o texto de cada célula. */
export function linhasDeTabela(html) {
  return [...String(html || '').matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((tr) =>
    [...tr[0].matchAll(/<t[dh]\b[\s\S]*?<\/t[dh]>/gi)].map((td) => htmlParaTexto(td[0])));
}

export const MESES = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
