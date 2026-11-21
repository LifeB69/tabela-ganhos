// Dinheiro em centavos inteiros: leitura, arredondamento, formatação e valor por extenso.

/**
 * Divide com arredondamento "meio para cima" (como a folha), sem erro de ponto flutuante.
 * numerador e denominador devem ser inteiros; denominador > 0.
 */
export function dividirArredondando(numerador, denominador) {
  if (!Number.isFinite(numerador) || !Number.isFinite(denominador) || denominador === 0) return 0;
  const sinal = (numerador < 0) !== (denominador < 0) ? -1 : 1;
  const n = Math.abs(numerador);
  const d = Math.abs(denominador);
  return sinal * Math.floor((2 * n + d) / (2 * d));
}

/** Converte uma porcentagem decimal (ex.: 7.5) em milionésimos inteiros (75000). */
export function pctParaMilionesimos(pct) {
  return Math.round(Number(pct) * 10000);
}

/** centavos × pct%, arredondado para centavos. */
export function aplicarPct(centavos, pct) {
  return dividirArredondando(Math.round(centavos) * pctParaMilionesimos(pct), 1000000);
}

/** Maior valor aceito numa entrada de dinheiro: R$ 1 bilhão (em centavos). */
export const LIMITE_CENTAVOS = 100000000000;

/**
 * Lê um valor de dinheiro digitado e devolve centavos inteiros, ou null se não der para ler.
 * Aceita: "1.621,00", "1621", "R$ 1621", "1621,5", "1621.50", "1.621", número (em reais).
 * Regra do ponto: com 1 ou 2 dígitos depois do último ponto (e sem vírgula) é decimal;
 * com 3 dígitos é separador de milhar.
 */
export function parseDinheiro(entrada) {
  if (entrada === null || entrada === undefined) return null;
  if (typeof entrada === 'number') {
    if (!Number.isFinite(entrada)) return null;
    const c = Math.round(entrada * 100);
    return Number.isSafeInteger(c) ? c : null;
  }
  let s = String(entrada).trim();
  if (!s) return null;
  s = s.replace(/R\$/gi, '').replace(/[\s ]/g, '');
  let negativo = false;
  if (s.startsWith('-')) { negativo = true; s = s.slice(1); }
  if (!/^[0-9.,]+$/.test(s)) return null;

  let inteira;
  let decimal = '';
  if (s.includes(',')) {
    const partes = s.split(',');
    if (partes.length !== 2) return null;
    inteira = partes[0].replace(/\./g, '');
    decimal = partes[1];
  } else if (s.includes('.')) {
    const partes = s.split('.');
    const ultima = partes[partes.length - 1];
    if (partes.length === 2 && ultima.length > 0 && ultima.length <= 2) {
      inteira = partes[0];
      decimal = ultima;
    } else {
      if (partes.slice(1).some((p) => p.length !== 3)) return null;
      inteira = partes.join('');
    }
  } else {
    inteira = s;
  }
  if (inteira === '') inteira = '0';
  if (!/^\d+$/.test(inteira) || !/^\d*$/.test(decimal)) return null;
  if (decimal.length > 2) {
    // arredonda a terceira casa em diante
    const extra = Number('0.' + decimal.slice(2));
    decimal = decimal.slice(0, 2);
    let c = Number(inteira) * 100 + Number(decimal.padEnd(2, '0'));
    if (extra >= 0.5) c += 1;
    if (!Number.isSafeInteger(c)) return null;
    return negativo ? -c : c;
  }
  const centavos = Number(inteira) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(centavos)) return null; // número grande demais (ex.: 400 dígitos vira Infinity)
  return negativo ? -centavos : centavos;
}

/** Aceita centavos (número) ou texto digitado; devolve centavos ou null. */
export function lerCentavos(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return null;
    const c = Math.round(v);
    return Number.isSafeInteger(c) ? c : null;
  }
  return parseDinheiro(v);
}

function agruparMilhar(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Formata centavos como "R$ 1.621,00". Usa espaço comum (não o NBSP do Intl). */
export function formatarBRL(centavos, { simbolo = true } = {}) {
  if (!Number.isFinite(centavos)) return simbolo ? 'R$ 0,00' : '0,00';
  const c = Math.round(centavos);
  const neg = c < 0;
  const abs = Math.abs(c);
  const texto = `${agruparMilhar(Math.floor(abs / 100))},${String(abs % 100).padStart(2, '0')}`;
  return `${neg ? '-' : ''}${simbolo ? 'R$ ' : ''}${texto}`;
}

/** Formata um número decimal em pt-BR (ex.: 7.5 -> "7,5"). */
export function formatarNumero(n, casas = null) {
  if (!Number.isFinite(n)) return '0';
  let s = casas === null ? String(Math.round(n * 1e6) / 1e6) : n.toFixed(casas);
  const [i, d] = s.split('.');
  const neg = i.startsWith('-');
  const inteiro = agruparMilhar(neg ? i.slice(1) : i);
  return `${neg ? '-' : ''}${inteiro}${d ? ',' + d : ''}`;
}

export function formatarPct(pct) {
  return `${formatarNumero(pct)}%`;
}

/** Arredonda para múltiplos de 'passo' centavos (ex.: 50 = R$ 0,50). 0 ou nulo = sem arredondamento. */
export function arredondarPara(centavos, passo) {
  if (!passo) return centavos;
  return dividirArredondando(centavos, passo) * passo;
}

// ───────────── Por extenso (para recibo) ─────────────
const UNIDADES = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos',
  'setecentos', 'oitocentos', 'novecentos'];

function ate999(n) {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  const c = Math.floor(n / 100);
  const r = n % 100;
  const partes = [];
  if (c) partes.push(CENTENAS[c]);
  if (r) {
    if (r < 20) partes.push(UNIDADES[r]);
    else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      partes.push(u ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d]);
    }
  }
  return partes.join(' e ');
}

function inteiroPorExtenso(n) {
  if (n === 0) return 'zero';
  const grupos = [];
  let x = n;
  while (x > 0) { grupos.push(x % 1000); x = Math.floor(x / 1000); }
  const nomes = [['', ''], ['mil', 'mil'], ['milhão', 'milhões'], ['bilhão', 'bilhões']];
  const partes = [];
  for (let i = grupos.length - 1; i >= 0; i--) {
    const g = grupos[i];
    if (!g) continue;
    let t;
    if (i === 1 && g === 1) t = 'mil';
    else t = ate999(g) + (i > 0 ? ' ' + (g === 1 ? nomes[i][0] : nomes[i][1]) : '');
    partes.push({ t, g, i });
  }
  let s = '';
  partes.forEach((p, k) => {
    if (k === 0) { s = p.t; return; }
    const ultimo = k === partes.length - 1;
    const usaE = ultimo && (p.g < 100 || p.g % 100 === 0);
    s += (usaE ? ' e ' : ' ') + p.t;
  });
  return s;
}

/** Valor por extenso em reais. Ex.: 162100 -> "mil seiscentos e vinte e um reais". */
export function porExtenso(centavos) {
  const c = Math.abs(Math.round(centavos || 0));
  const reais = Math.floor(c / 100);
  const cent = c % 100;
  const partes = [];
  if (reais > 0) {
    let r = inteiroPorExtenso(reais);
    const milhoesRedondos = reais >= 1000000 && reais % 1000000 === 0;
    r += milhoesRedondos ? ' de reais' : reais === 1 ? ' real' : ' reais';
    partes.push(r);
  }
  if (cent > 0) partes.push(`${inteiroPorExtenso(cent)} ${cent === 1 ? 'centavo' : 'centavos'}`);
  if (!partes.length) return 'zero real';
  return partes.join(' e ');
}
