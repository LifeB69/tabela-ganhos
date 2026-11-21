// Decreto do salário mínimo no site do Planalto.
// Quadro de decretos do ano: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/_decretos2025.htm
// (de 2027 em diante a pasta é _ato2027-2030). Cada linha traz o link (D12797.htm) e a ementa.
import { htmlParaTexto, semAcento, reaisParaCentavos, linhasDeTabela, MESES } from '../texto.js';

/** Pasta do quadriênio: 2023–2026 → _ato2023-2026; 2027–2030 → _ato2027-2030. */
export function pastaAto(ano) {
  const ini = 2019 + Math.floor((ano - 2019) / 4) * 4;
  return `_ato${ini}-${ini + 3}`;
}

export function urlQuadro(ano) {
  return `https://www.planalto.gov.br/ccivil_03/${pastaAto(ano)}/${ano}/decreto/_decretos${ano}.htm`;
}

/**
 * Procura no quadro o decreto que fixa o mínimo a partir de 1º de janeiro de anoAlvo.
 * Devolve [{ numero, url, ementa }] (normalmente 0 ou 1).
 */
export function acharDecretoMinimo(html, urlBase, anoAlvo) {
  let linhas = [...String(html || '').matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((m) => m[0]);
  if (!linhas.length) linhas = String(html || '').split(/<p\b/i);   // quadro sem tabela
  const achados = [];
  for (const linha of linhas) {
    const texto = semAcento(htmlParaTexto(linha));
    if (!/salario[\s-]+minimo/.test(texto)) continue;
    if (!texto.includes(String(anoAlvo))) continue;
    if (!/(a vigorar|a partir de|valor do salario)/.test(texto)) continue;
    const href = /<a\b[^>]*href=["']([^"'#]+\.html?)["']/i.exec(linha);
    if (!href) continue;
    const num = /decreto\s*n?[º°o.]*\s*([\d.]+)/i.exec(htmlParaTexto(linha));
    let url;
    try { url = new URL(href[1], urlBase).href; } catch { continue; }
    achados.push({ numero: num ? num[1].replace(/\.$/, '') : null, url, ementa: htmlParaTexto(linha).slice(0, 300) });
  }
  // sem repetição de URL
  return achados.filter((a, i) => achados.findIndex((b) => b.url.toLowerCase() === a.url.toLowerCase()) === i);
}

/**
 * Só aceita endereço do próprio Planalto: https, host www.planalto.gov.br ou planalto.gov.br e
 * caminho dentro de /ccivil_03/_atoAAAA-AAAA/. Qualquer outro servidor não é fonte oficial.
 */
export function urlOficialPlanalto(url) {
  let u;
  try { u = new URL(String(url)); } catch { return false; }
  return u.protocol === 'https:'
    && (u.hostname === 'www.planalto.gov.br' || u.hostname === 'planalto.gov.br')
    && !u.username && !u.password && (u.port === '' || u.port === '443')
    && /^\/ccivil_03\/_ato\d{4}-\d{4}\//i.test(u.pathname);
}

/** Variante com o nome do arquivo em minúsculas (o Planalto às vezes redireciona D12797 → d12797). */
export function urlMinuscula(url) {
  const i = url.lastIndexOf('/');
  return url.slice(0, i + 1) + url.slice(i + 1).toLowerCase();
}

/**
 * Tira do HTML o que NÃO é a redação em vigor: texto tachado (<strike>, <s>, <del>, que é como o
 * Planalto mostra a redação revogada ou alterada) e parágrafos marcados "(Revogado ...)".
 * Também junta o ordinal em <sup>o</sup> ao número ("1<sup>o</sup>" → "1o").
 */
export function redacaoEmVigor(html) {
  let s = String(html || '').replace(/<!--[\s\S]*?-->/g, ' ');
  for (let i = 0; i < 5; i++) {   // tachados aninhados
    const antes = s;
    s = s.replace(/<(strike|s|del)\b[^>]*>(?:(?!<\1\b)[\s\S])*?<\/\1\s*>/gi, ' ');
    if (s === antes) break;
  }
  s = s.replace(/<sup\b[^>]*>\s*([ºª°oa])\s*<\/sup>/gi, '$1');
  // parágrafo inteiro revogado
  s = s.replace(/<p\b[^>]*>(?:(?!<\/?p\b)[\s\S])*?\(\s*revogad[oa][\s\S]*?<\/p>/gi, ' ');
  return s;
}

/**
 * Lê o texto do decreto: valor mensal, diário e horário e a data em que vale.
 * Devolve { ok, numero, mensal, diario, horario, vigente_desde, alterado, motivo }.
 * alterado = o texto traz "Redação dada", "Retificação" ou "(Vide ...)": o decreto foi mexido depois
 * de publicado, e o robô só aplica com o Banco Central conferindo o ano.
 * Mais de uma frase "o salário mínimo será de R$" na redação em vigor = ok false (não sei qual vale).
 */
export function lerDecretoMinimo(html) {
  const texto = htmlParaTexto(redacaoEmVigor(html));
  const t = semAcento(texto);
  const r = { ok: false, numero: null, data_decreto: null, mensal: null, diario: null, horario: null, vigente_desde: null, alterado: false, motivo: null };
  const num = /decreto\s*n?\s*[º°o.]*\s*(\d{1,2}\.\d{3})\s*,?\s*de\s*(\d{1,2})\s*[º°o]?\s*de\s*([a-zç]+)\s*de\s*(\d{4})/i.exec(t);
  if (num) {
    r.numero = num[1];
    const mes = MESES.indexOf(num[3].replace('ç', 'c'));
    if (mes >= 0) r.data_decreto = `${num[4]}-${String(mes + 1).padStart(2, '0')}-${String(num[2]).padStart(2, '0')}`;
  }
  r.alterado = /redacao\s+dada\s+pel|retificac|\(\s*vide\b|\(\s*incluid[oa]\s+pel/.test(t);
  const mensais = [...t.matchAll(/salario[\s-]+minimo\s+sera\s+de\s+r\$\s*([\d.]+,\d{2})/g)];
  const diarios = [...t.matchAll(/valor\s+diario[^$]{0,120}?r\$\s*([\d.]+,\d{2})/g)];
  const horarios = [...t.matchAll(/valor\s+horario[^$]{0,120}?r\$\s*([\d.]+,\d{2})/g)];
  const desdes = [...t.matchAll(/a\s+partir\s+de\s+(\d{1,2})\s*[º°o]?\s+de\s+([a-zç]+)\s+de\s+(\d{4})\s*,?\s*o\s+salario[\s-]+minimo/g)];
  const mensal = mensais[0];
  const diario = diarios[0];
  const horario = horarios[0];
  const desde = desdes[0];
  r.mensal = mensal ? reaisParaCentavos(mensal[1]) : null;
  r.diario = diario ? reaisParaCentavos(diario[1]) : null;
  r.horario = horario ? reaisParaCentavos(horario[1]) : null;
  if (desde) {
    const mes = MESES.indexOf(desde[2].replace('ç', 'c'));
    if (mes >= 0) r.vigente_desde = `${desde[3]}-${String(mes + 1).padStart(2, '0')}-${String(desde[1]).padStart(2, '0')}`;
  }
  if (!r.mensal) r.motivo = 'não achei "o salário mínimo será de R$ ..." no texto';
  else if (mensais.length > 1 || diarios.length > 1 || horarios.length > 1 || desdes.length > 1) {
    r.motivo = `o texto em vigor tem mais de uma redação do valor (${mensais.length} mensal, ${diarios.length} diário, ${horarios.length} horário): não sei qual vale`;
  } else if (!r.vigente_desde) r.motivo = 'não achei a data "A partir de ... o salário mínimo"';
  else if (!r.diario) r.motivo = 'não achei o valor diário no parágrafo único';
  else r.ok = true;
  return r;
}

export { linhasDeTabela };
