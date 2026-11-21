// Tabela de Ganhos v2 — tela Calcular: utilidades comuns aos modos (datas, meses, lembrança, exemplos).

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** '2026-11-20' -> '20/11/2026' */
export function dataBR(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return '';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** '2026-11' -> 'novembro de 2026' */
export function nomeMes(mes) {
  const [a, m] = String(mes).split('-').map(Number);
  return MESES[m - 1] ? `${MESES[m - 1]} de ${a}` : String(mes);
}

/** '2026-11' ou '2026-11-20' -> 'nov/2026' */
export function mesCurto(mes) {
  const [a, m] = String(mes).split('-').map(Number);
  return MESES_CURTOS[m - 1] ? `${MESES_CURTOS[m - 1]}/${a}` : String(mes);
}

/** Mês válido 'AAAA-MM' (01 a 12)? */
export function mesValido(mes) {
  return typeof mes === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes);
}

/** Opções de mês: do mês anterior a 12 meses depois do mês da data. [{ valor: 'AAAA-MM', texto }] */
export function opcoesMeses(dataISO) {
  const [a, m] = dataISO.split('-').map(Number);
  const lista = [];
  for (let i = -1; i <= 12; i++) {
    const d = new Date(Date.UTC(a, m - 1 + i, 1));
    const valor = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    lista.push({ valor, texto: nomeMes(valor) });
  }
  return lista;
}

/** Garante que um <select> tenha a opção (para mês vindo de link ou salvo fora da lista). */
export function garantirOpcao(select, valor, texto) {
  if ([...select.options].some((o) => o.value === valor)) return;
  const o = document.createElement('option');
  o.value = valor;
  o.textContent = texto;
  select.append(o);
}

/** Espera um tempo depois da última chamada. */
export function adiar(fn, ms) {
  let t = null;
  const f = (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  f.cancelar = () => clearTimeout(t);
  return f;
}

/** Tira chaves vazias (null, '', undefined, NaN) de um objeto de entrada. */
export function semVazios(o) {
  const saida = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === null || v === undefined || v === '' || (typeof v === 'number' && !Number.isFinite(v))) continue;
    saida[k] = v;
  }
  return saida;
}

/** Número de uma entrada (aceita "4,5"); null se não for número. */
export function numeroDe(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  let t = String(v).trim();
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// ───────────── Lembrança do último estado por modo (só neste aparelho) ─────────────
// Guarda só os números de cada modo, para a calculadora reabrir como a pessoa deixou.
// Fica na config (chave "calcular"): entra no backup e sai com "Apagar tudo".
export function lerLembranca(ctx) {
  const c = ctx.config.calcular;
  return c && typeof c === 'object' && !Array.isArray(c) ? c : {};
}

export function gravarLembranca(ctx, parcial) {
  const atual = lerLembranca(ctx);
  const mudou = Object.entries(parcial).some(([k, v]) => JSON.stringify(atual[k]) !== JSON.stringify(v));
  if (!mudou) return;
  ctx.salvarConfig({ calcular: parcial }).catch(() => { /* sem armazenamento: só não lembra */ });
}

// ───────────── Exemplos de profissão ─────────────
// Só preenchem horas e dias. O valor fica com o mínimo legal, marcado assim; nunca um "preço de mercado".
export const EXEMPLOS = Object.freeze([
  { id: 'diarista', nome: 'Diarista', modo: 'diarista', descricao: '8 horas por dia, 1 dia por semana, paga por hora' },
  { id: 'baba', nome: 'Babá', modo: 'domestico', descricao: 'mensalista com a jornada cheia' },
  { id: 'cuidador', nome: 'Cuidador de idosos', modo: 'domestico', descricao: 'horista, 24 horas por semana' },
  { id: 'obra', nome: 'Ajudante de obra', modo: 'porHora', descricao: '8 horas por dia, de segunda a sexta' },
  { id: 'professor', nome: 'Professor particular', modo: 'porHora', descricao: '2 horas por dia, terça e quinta' },
]);

/**
 * Entrada de um exemplo, com o valor no mínimo legal da data.
 * @returns {{ entrada: object, valorTexto: string }} valorTexto: "R$ 7,37 por hora (mínimo legal)"
 */
export function entradaExemplo(id, ctx, dataISO, mesAtual) {
  const { motor } = ctx;
  const cfg = ctx.config;
  const overrides = ctx.overrides();
  const hm = motor.horaMinima(dataISO, overrides).valor;
  const piso = motor.pisoDomestico(cfg.uf || null, dataISO, overrides, { grupoPR: cfg.grupoPR });
  const nomePiso = piso.origem === 'piso_uf' ? `piso de ${piso.uf}` : 'salário mínimo';
  const divisor = motor.obterJornada(dataISO, overrides).divisor;
  const horaPiso = Math.max(hm, Math.ceil(piso.valor / divisor));
  const porHora = (v) => `${motor.formatarBRL(v)} por hora (mínimo legal)`;
  switch (id) {
    case 'diarista':
      return { entrada: { valorHora: hm, horasDia: 8, diasDaSemana: [2], mesmaResidencia: true, mes: mesAtual }, valorTexto: porHora(hm) };
    case 'baba':
      return { entrada: { tipo: 'mensalista', salario: piso.valor, uf: cfg.uf || undefined }, valorTexto: `${motor.formatarBRL(piso.valor)} por mês (mínimo legal: ${nomePiso})` };
    case 'cuidador':
      return { entrada: { tipo: 'horista', valorHora: horaPiso, horasSemana: 24, uf: cfg.uf || undefined }, valorTexto: porHora(horaPiso) };
    case 'obra':
      return { entrada: { valorHora: hm, horasDia: 8, diasDaSemana: [1, 2, 3, 4, 5], mes: mesAtual }, valorTexto: porHora(hm) };
    case 'professor':
      return { entrada: { valorHora: hm, horasDia: 2, diasDaSemana: [2, 4], mes: mesAtual }, valorTexto: porHora(hm) };
    default:
      return { entrada: {}, valorTexto: '' };
  }
}
