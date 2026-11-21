// Séries oficiais em JSON: salário mínimo no SGS do Banco Central (série 1619) e INPC no SIDRA do IBGE.

/**
 * SGS 1619: [{ data: '01/01/2026', valor: '1621.00' }, ...] → { 2026: 162100, ... } (valor de janeiro).
 * Devolve null se o formato não for o esperado.
 */
export function lerSerieMinimo(texto) {
  const meses = lerSerieMinimoMeses(texto);
  if (!meses) return null;
  const porAno = {};
  for (const [mes, v] of Object.entries(meses)) if (mes.endsWith('-01')) porAno[Number(mes.slice(0, 4))] = v;
  return porAno;
}

/**
 * SGS 1619 com TODOS os meses: { '2026-01': 162100, '2026-02': 162100, ... }.
 * Serve para perceber mínimo que muda no meio do ano (MP ou decreto a partir de fevereiro, maio...).
 * Devolve null se o formato não for o esperado.
 */
export function lerSerieMinimoMeses(texto) {
  let dados;
  try { dados = JSON.parse(texto); } catch { return null; }
  if (!Array.isArray(dados)) return null;
  const meses = {};
  for (const d of dados) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d && d.data);
    const v = /^\d+(\.\d{1,2})?$/.test(String(d && d.valor)) ? Math.round(Number(d.valor) * 100) : null;
    if (!m || v === null) return null;
    meses[`${m[3]}-${m[2]}`] = v;
  }
  return meses;
}

/**
 * SIDRA tabela 1736, variável 2292 (INPC acumulado em 12 meses), último período.
 * Devolve { periodo: '202611', ano: 2026, mes: 11, pct: 4.49 } ou null.
 */
export function lerInpc(texto) {
  let dados;
  try { dados = JSON.parse(texto); } catch { return null; }
  if (!Array.isArray(dados) || dados.length < 2) return null;
  const linha = dados[dados.length - 1];
  if (!linha || linha.D2C !== '2292' || !/^\d{6}$/.test(String(linha.D3C))) return null;
  const pct = Number(String(linha.V).replace(',', '.'));
  if (!/^-?\d+([.,]\d+)?$/.test(String(linha.V)) || !Number.isFinite(pct)) return null;
  return { periodo: linha.D3C, ano: Number(linha.D3C.slice(0, 4)), mes: Number(linha.D3C.slice(4)), pct, rotulo: linha.D3N || null };
}
