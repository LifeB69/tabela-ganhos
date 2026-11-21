// Tabela de Ganhos v2 — tela Salvos: funções puras (busca, filtro, ordem, datas, CSV, lembrete de backup).
// Sem DOM aqui: dá para testar no Node.

/** Texto para comparar: minúsculo e sem acento ("Doméstico" -> "domestico"). */
export function semAcento(t) {
  return String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Filtra a lista pela busca (título, notas, etiquetas), pela etiqueta e pelo modo.
 * @param {object[]} lista salvos
 * @param {{ busca?: string, etiqueta?: string|null, modo?: string|null }} filtro
 */
export function filtrar(lista, { busca = '', etiqueta = null, modo = null } = {}) {
  const termos = semAcento(busca).split(/\s+/).filter(Boolean);
  const alvoEtiqueta = etiqueta ? semAcento(etiqueta) : null;
  return lista.filter((s) => {
    if (modo && s.modo !== modo) return false;
    if (alvoEtiqueta && !s.etiquetas.some((t) => semAcento(t) === alvoEtiqueta)) return false;
    if (!termos.length) return true;
    const texto = semAcento([s.titulo, s.notas, ...s.etiquetas].join(' \n '));
    return termos.every((t) => texto.includes(t));
  });
}

const comparador = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/**
 * Ordena: fixados sempre no topo; depois 'recentes' (editado por último primeiro) ou 'titulo' (A a Z).
 * Não muda a lista recebida.
 */
export function ordenar(lista, ordem = 'recentes') {
  return [...lista].sort((a, b) => {
    const fix = (b.fixado === true) - (a.fixado === true);
    if (fix) return fix;
    if (ordem === 'titulo') return comparador.compare(a.titulo, b.titulo) || String(b.editado_em).localeCompare(String(a.editado_em));
    return String(b.editado_em).localeCompare(String(a.editado_em)) || comparador.compare(a.titulo, b.titulo);
  });
}

/** Etiquetas usadas, sem repetir (ignora maiúscula e acento), em ordem alfabética, com a contagem. */
export function etiquetasUsadas(lista) {
  const mapa = new Map();
  for (const s of lista) {
    for (const t of s.etiquetas) {
      const k = semAcento(t);
      const atual = mapa.get(k);
      if (atual) atual.n += 1; else mapa.set(k, { texto: t, n: 1 });
    }
  }
  return [...mapa.values()].sort((a, b) => comparador.compare(a.texto, b.texto));
}

/** "casa, Mãe ,  casa" -> ['casa', 'Mãe'] (sem vazios, sem repetidos, até 20, cada até 40). */
export function lerEtiquetas(texto) {
  const vistas = new Set();
  const saida = [];
  for (const parte of String(texto ?? '').split(/[,;\n]/)) {
    const t = parte.replace(/\s+/g, ' ').trim().slice(0, 40);
    const k = semAcento(t);
    if (!t || vistas.has(k)) continue;
    vistas.add(k);
    saida.push(t);
    if (saida.length >= 20) break;
  }
  return saida;
}

/** 'AAAA-MM-DD' -> 'DD/MM/AAAA' (ou null). */
export function dataBR(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

/** Data ISO completa (com hora) -> 'DD/MM/AAAA' no fuso do aparelho. */
export function dataLocalBR(isoCompleto) {
  const d = new Date(isoCompleto);
  if (Number.isNaN(d.getTime())) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Trecho curto das notas (uma linha, até `max` caracteres, cortando numa palavra). */
export function trecho(texto, max = 140) {
  const t = String(texto ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const corte = t.slice(0, max);
  const espaco = corte.lastIndexOf(' ');
  return `${(espaco > max * 0.6 ? corte.slice(0, espaco) : corte).replace(/[\s,.;:–-]+$/, '')}…`;
}

// ───────────── CSV para planilha ─────────────
// Separador ";" e vírgula decimal: é o que o Excel e o LibreOffice em português abrem sem perguntar.
// O arquivo começa com BOM para os acentos aparecerem certos no Excel.

/** Texto do usuário numa célula: protege contra fórmula (=, +, -, @) e escapa aspas. */
function celulaTexto(v) {
  let t = String(v ?? '').replace(/\r\n?/g, '\n');
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return `"${t.replace(/"/g, '""')}"`;
}

/** Centavos -> "1621,00" (sem ponto de milhar, para a planilha entender como número). */
export function centavosCsv(c) {
  if (!Number.isSafeInteger(c)) return '';
  const neg = c < 0;
  const abs = Math.abs(c);
  return `${neg ? '-' : ''}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
}

/**
 * Monta o CSV dos salvos.
 * @param {object[]} lista salvos
 * @param {{ nomesModo: object }} opcoes
 * @returns {string}
 */
export function montarCsv(lista, { nomesModo = {} } = {}) {
  const cab = ['Título', 'Modo', 'O que o valor é', 'Valor (R$)', 'Data da conta', 'Valores da lei de', 'Etiquetas', 'Fixado', 'Notas', 'Criado em', 'Editado em'];
  const linhas = [cab.map(celulaTexto).join(';')];
  for (const s of lista) {
    linhas.push([
      celulaTexto(s.titulo),
      celulaTexto(nomesModo[s.modo] || s.modo),
      celulaTexto(s.resumo && s.resumo.rotulo),
      centavosCsv(s.resumo && s.resumo.valor_centavos),
      celulaTexto(dataBR(s.data_referencia) || ''),
      celulaTexto(dataBR(s.parametros_versao) || s.parametros_versao || ''),
      celulaTexto(s.etiquetas.join(', ')),
      celulaTexto(s.fixado ? 'sim' : 'não'),
      celulaTexto(s.notas),
      celulaTexto(dataLocalBR(s.criado_em) || ''),
      celulaTexto(dataLocalBR(s.editado_em) || ''),
    ].join(';'));
  }
  return `﻿${linhas.join('\r\n')}\r\n`;
}

// ───────────── Lembrete de backup ─────────────
export const DIAS_SEM_BACKUP = 30;
export const MINIMO_PARA_LEMBRAR = 5;
export const DIAS_ADIAR = 7;

/**
 * Mostrar o lembrete? Quando há 5 ou mais salvos, nenhum backup nos últimos 30 dias e a pessoa não adiou.
 * @param {{ quantos: number, ultimoBackup: string|null, adiadoAte: string|null, agora?: Date }} dados
 */
export function deveLembrarBackup({ quantos, ultimoBackup, adiadoAte, agora = new Date() }) {
  if (quantos < MINIMO_PARA_LEMBRAR) return false;
  const t = agora.getTime();
  const adiado = adiadoAte ? Date.parse(adiadoAte) : NaN;
  if (Number.isFinite(adiado) && adiado > t) return false;
  const ultimo = ultimoBackup ? Date.parse(ultimoBackup) : NaN;
  if (!Number.isFinite(ultimo)) return true;
  return t - ultimo > DIAS_SEM_BACKUP * 86400000;
}

/**
 * Prévia da importação: quantos entram, quantos trocam um salvo daqui, quantos ficam de fora.
 * Mesma regra de armazem.importarTudo no modo "juntar": um salvo daqui só é trocado se o do backup for mais novo.
 * @param {object[]} doBackup salvos já normalizados do backup
 * @param {object[]} atuais salvos deste aparelho
 */
export function previaImportacao(doBackup, atuais) {
  const porId = new Map(atuais.map((s) => [s.id, s]));
  let novos = 0; let trocados = 0; let iguais = 0;
  for (const s of doBackup) {
    const atual = porId.get(s.id);
    if (!atual) novos += 1;
    else if (String(atual.editado_em) >= String(s.editado_em)) iguais += 1;
    else trocados += 1;
  }
  return { novos, trocados, iguais, total: doBackup.length };
}

/** "1 cálculo" / "3 cálculos". */
export function plural(n, um, varios) { return `${n.toLocaleString('pt-BR')} ${n === 1 ? um : varios}`; }
