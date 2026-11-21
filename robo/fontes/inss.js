// Páginas do INSS no gov.br: tabela de contribuição mensal e salário-família.
import { htmlParaTexto, semAcento, valoresEmReais, conteudoPrincipal, linhasDeTabela, MESES } from '../texto.js';

/**
 * Tabela do empregado, doméstico e avulso.
 * Devolve { ok, ano, mes, faixas: [{ de, ate, aliquota_pct }], teto, portaria, motivo }.
 */
export function lerTabelaInss(html) {
  const r = { ok: false, ano: null, mes: null, faixas: [], teto: null, portaria: null, motivo: null };
  const corpo = conteudoPrincipal(html);
  const texto = htmlParaTexto(corpo);
  const t = semAcento(texto);
  const comp = /competencia\s+(?:de\s+)?([a-zç]+)\s*(?:de|\/)\s*(\d{4})/.exec(t);
  if (comp) {
    const mes = MESES.indexOf(comp[1].replace('ç', 'c'));
    r.ano = Number(comp[2]);
    r.mes = mes >= 0 ? mes + 1 : null;
  }
  const port = /portaria\s+interministerial\s+[a-z/]+\s*n[º°o.]*\s*(\d+)\s*,?\s*de\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4})/.exec(t);
  if (port) r.portaria = `Portaria Interministerial nº ${port[1]}, de ${port[2]}`;

  // Primeira tabela depois de "Empregado, Empregado Doméstico e Trabalhador Avulso".
  const iMarca = semAcento(corpo).search(/para\s+empregado\s*,?\s*empregado\s+domestico/);
  if (iMarca < 0) { r.motivo = 'não achei o título da tabela do empregado'; return r; }
  const resto = corpo.slice(iMarca);
  const tab = /<table\b[\s\S]*?<\/table>/i.exec(resto);
  if (!tab) { r.motivo = 'não achei a tabela do empregado'; return r; }
  for (const cel of linhasDeTabela(tab[0])) {
    if (cel.length < 2) continue;
    const aliq = /^\s*(\d{1,2}(?:,\d{1,2})?)\s*%\s*$/.exec(cel[1]);
    if (!aliq) continue;
    const vals = valoresEmReais(cel[0]);
    if (!vals.length || vals.some((v) => v === null)) { r.motivo = `faixa ilegível: "${cel[0]}"`; return r; }
    const ate = vals[vals.length - 1];
    const de = vals.length > 1 ? vals[0] : 0;
    r.faixas.push({ de, ate, aliquota_pct: Number(aliq[1].replace(',', '.')) });
  }
  if (!r.faixas.length) { r.motivo = 'tabela do empregado sem faixas'; return r; }
  if (!r.ano) { r.motivo = 'não achei a competência (mês e ano) da tabela'; return r; }
  r.teto = r.faixas[r.faixas.length - 1].ate;
  r.ok = true;
  return r;
}

/**
 * Checagens para aplicar sozinho a tabela nova. Devolve lista de problemas (vazia = passa).
 * anterior = { faixas, teto } da vigência oficial anterior; minimo = centavos do mínimo oficial do mesmo ano.
 */
export function checarTabelaInss(nova, { anterior, minimo, aliquotas, aumentoMaximoPct }) {
  const p = [];
  const al = nova.faixas.map((f) => f.aliquota_pct);
  if (al.length !== aliquotas.length || al.some((a, i) => a !== aliquotas[i])) p.push(`alíquotas mudaram: ${al.join('/')} (esperado ${aliquotas.join('/')})`);
  for (let i = 0; i < nova.faixas.length; i++) {
    const f = nova.faixas[i];
    if (!(f.ate > f.de)) p.push(`faixa ${i + 1} não é crescente`);
    if (i === 0 && f.de !== 0) p.push('a 1ª faixa não começa do zero');
    if (i > 0 && f.de !== nova.faixas[i - 1].ate + 1) p.push(`faixa ${i + 1} não continua a anterior (${nova.faixas[i - 1].ate} → ${f.de})`);
  }
  if (minimo == null) p.push('o mínimo oficial do mesmo ano ainda não foi aplicado');
  else if (nova.faixas[0] && nova.faixas[0].ate !== minimo) p.push(`1ª faixa (${nova.faixas[0].ate}) diferente do mínimo oficial (${minimo})`);
  if (anterior && anterior.teto) {
    const pct = ((nova.teto - anterior.teto) / anterior.teto) * 100;
    if (!(pct >= 0 && pct <= aumentoMaximoPct)) p.push(`teto variou ${pct.toFixed(2)}% (aceito de 0% a ${aumentoMaximoPct}%)`);
  }
  return p;
}

/**
 * Salário-família: linha mais recente "A partir de 01/01/AAAA | Até 1.980,38 cota 67,54 | — | PORTARIA ...".
 * Devolve { ok, vigente_desde, limite_remuneracao, cota_por_filho, normativo, motivo }.
 */
export function lerSalarioFamilia(html) {
  const r = { ok: false, vigente_desde: null, limite_remuneracao: null, cota_por_filho: null, normativo: null, motivo: null };
  let melhor = null;
  for (const cel of linhasDeTabela(conteudoPrincipal(html))) {
    const d = /a\s+partir\s+de\s*(\d{1,2})[º°o]?\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/i.exec(cel[0] || '');
    if (!d || cel.length < 2) continue;
    const iso = `${d[3]}-${d[2].padStart(2, '0')}-${d[1].padStart(2, '0')}`;
    const f1 = semAcento(cel[1]);
    const lim = /ate\s*(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/.exec(f1);
    const cota = /cota\s*(?:r\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/.exec(f1);
    if (!lim || !cota) continue;
    if (!melhor || iso > melhor.vigente_desde) {
      melhor = { vigente_desde: iso, limite_remuneracao: valoresEmReais(lim[1], { exigirCifrao: false })[0], cota_por_filho: valoresEmReais(cota[1], { exigirCifrao: false })[0], normativo: cel[cel.length - 1] || null, faixa2: cel[2] || '' };
    }
  }
  if (!melhor) { r.motivo = 'não achei a linha "A partir de dd/mm/aaaa ... Até ... cota ..."'; return r; }
  if (/\d+,\d{2}/.test(melhor.faixa2)) { r.motivo = 'a tabela voltou a ter 2 faixas; o app só tem uma'; return { ...r, ...melhor, ok: false }; }
  delete melhor.faixa2;
  return { ...r, ...melhor, ok: true };
}
