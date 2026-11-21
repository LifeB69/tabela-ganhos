// Tabela de Ganhos v2 — tela "Leis": leitura dos textos de dados/leis.js.
// Funções puras (sem tela): rodam no navegador e no Node, para testar o conteúdo.
//
// Marcações aceitas nos textos:
//   {chave.caminho}            valor do parâmetro na data (motor.getParam), formatado pela unidade
//   {chave#i.caminho}          a vigência número i (0, 1, 2…) do parâmetro, mesmo prevista
//   {…:formato}                brl | pct | num | data | ate | ano | dm | hora | minseg | dia
//   {=nome}                    valor calculado pela tela (ex.: {=proximoDae})
//   [[id]] ou [[id|texto]]     palavra do glossário (a tela mostra o termo em destaque)
//   **texto**                  negrito
// Valor previsto ganha " (previsto)"; não verificado ganha " (não verificado)".

const RE_PARTES = /(\*\*[^*]+\*\*|\{=?[a-zA-Z0-9_]+(?:#\d+)?(?:\.[a-zA-Z0-9_]+)*(?::[a-z]+)?\}|\[\[[a-z0-9-]+(?:\|[^\]]+)?\]\])/g;
const RE_VALOR = /^\{(=?)([a-zA-Z0-9_]+)(?:#(\d+))?((?:\.[a-zA-Z0-9_]+)*)(?::([a-z]+))?\}$/;
const RE_TERMO = /^\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]$/;

const FORMATOS_DE_DATA = new Set(['data', 'ate', 'ano']);

/** Texto sem acento e em minúsculas, para a busca. */
export function normalizar(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** 'AAAA-MM-DD' -> 'DD/MM/AAAA' (texto vazio se não for data). */
export function dataBR(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function pegarCaminho(valor, caminho) {
  let v = valor;
  for (const parte of caminho) {
    if (v === null || v === undefined) return undefined;
    v = v[parte];
  }
  return v;
}

function formatar(motor, v, formato, unidade, ultimaChave) {
  if (v === null || v === undefined) return null;
  let f = formato;
  if (!f) {
    if (typeof v === 'string') return v;
    if (/pct|percentual/.test(ultimaChave || '')) f = 'pct';
    else if (unidade === 'centavos') f = 'brl';
    else f = 'num';
  }
  switch (f) {
    case 'brl': return Number.isFinite(v) ? motor.formatarBRL(v) : null;
    case 'pct': return Number.isFinite(v) ? motor.formatarPct(v) : null;
    case 'num': return Number.isFinite(v) ? motor.formatarNumero(v) : null;
    case 'dia': return Number.isFinite(v) ? `dia ${v}` : null;
    case 'dm': {   // 'MM-DD' -> 'DD/MM'
      const m = /^(\d{2})-(\d{2})$/.exec(String(v));
      return m ? `${m[2]}/${m[1]}` : null;
    }
    case 'hora': { // '22:00' -> '22h'; '05:30' -> '5h30'
      const m = /^(\d{2}):(\d{2})$/.exec(String(v));
      if (!m) return null;
      return `${Number(m[1])}h${m[2] === '00' ? '' : m[2]}`;
    }
    case 'minseg': { // segundos -> '52 min 30 s'
      if (!Number.isFinite(v)) return null;
      const min = Math.floor(v / 60);
      const s = v % 60;
      return s ? `${min} min ${s} s` : `${min} min`;
    }
    default: return null;
  }
}

/**
 * Resolve uma marcação de valor.
 * @param {string} marca  ex.: '{salario_minimo.mensal}'
 * @param {{ motor: object, data: string, calculados?: object }} amb
 * @returns {{ texto: string, status: string|null, fonte_url?: string, lei?: string } | null}
 */
export function resolverValor(marca, { motor, data, calculados = {} }) {
  const m = RE_VALOR.exec(marca);
  if (!m) return null;
  const [, igual, chave, indice, caminhoTexto, formato] = m;
  if (igual) {
    const c = calculados[chave];
    if (c === undefined || c === null) return null;
    return typeof c === 'object' ? c : { texto: String(c), status: null };
  }
  const def = motor.PARAMETROS.find((p) => p.chave === chave);
  if (!def) return null;
  let vig;
  if (indice !== undefined) {
    vig = motor.listarVigencias(chave)[Number(indice)] || null;
  } else {
    vig = motor.getParam(chave, data, {}, { incluirNaoVerificados: true })
      || motor.getParamComReserva(chave, data, {});
  }
  if (!vig) return null;
  const caminho = caminhoTexto ? caminhoTexto.slice(1).split('.') : [];
  let texto;
  if (FORMATOS_DE_DATA.has(formato)) {
    const iso = formato === 'ate' ? vig.vigente_ate : vig.vigente_desde;
    texto = formato === 'ano' ? (iso || '').slice(0, 4) : dataBR(iso);
    if (!texto) return null;
    return { texto, status: null, fonte_url: vig.fonte_url, lei: vig.lei };
  }
  const bruto = pegarCaminho(vig.valor, caminho);
  texto = formatar(motor, bruto, formato, def.unidade, caminho[caminho.length - 1]);
  if (texto === null) return null;
  let status = vig.status === 'vigente' ? null : vig.status;
  if (status === 'previsto') texto += ' (previsto)';
  if (status === 'nao_verificado') texto += ' (não verificado)';
  // Data sem tabela conferida (ex.: piso do PR depois de 31/12/2026): mostra o último valor, com o ano.
  if (!status && vig.fora_da_vigencia) { status = 'fora_da_vigencia'; texto += ` (valor de ${String(vig.vigente_desde).slice(0, 4)})`; }
  return { texto, status, fonte_url: vig.fonte_url, lei: vig.lei };
}

/**
 * Quebra um texto em partes para a tela montar.
 * @returns {Array<{ tipo: 'texto'|'valor'|'termo'|'falta', negrito?: boolean, texto: string, status?: string|null, id?: string, marca?: string }>}
 */
export function partes(texto, amb) {
  const saida = [];
  for (const pedaco of String(texto ?? '').split(RE_PARTES)) {
    if (!pedaco) continue;
    if (pedaco.startsWith('{')) {
      const r = resolverValor(pedaco, amb);
      if (r) saida.push({ tipo: 'valor', texto: r.texto, status: r.status });
      else saida.push({ tipo: 'falta', texto: '(valor indisponível)', marca: pedaco });
    } else if (pedaco.startsWith('[[')) {
      const m = RE_TERMO.exec(pedaco);
      if (m) saida.push({ tipo: 'termo', id: m[1], texto: m[2] || m[1] });
      else saida.push({ tipo: 'texto', texto: pedaco });
    } else if (pedaco.startsWith('**') && pedaco.endsWith('**') && pedaco.length > 4) {
      // O negrito pode ter valores e termos dentro: cada parte de dentro sai marcada com negrito: true.
      for (const p of partes(pedaco.slice(2, -2), amb)) saida.push({ ...p, negrito: true });
    } else {
      saida.push({ tipo: 'texto', texto: pedaco });
    }
  }
  return saida;
}

/** O texto já resolvido, sem marcações (para busca e para leitor de tela). */
export function textoPlano(texto, amb) {
  return partes(texto, amb).map((p) => p.texto).join('');
}

/** Lista de todas as marcações {…} de um texto (para teste). */
export function marcasDe(texto) {
  return String(texto ?? '').split(RE_PARTES).filter((p) => p && p.startsWith('{'));
}

/** Lista dos ids de glossário [[id]] de um texto. */
export function termosDe(texto) {
  return String(texto ?? '').split(RE_PARTES).map((p) => RE_TERMO.exec(p || '')).filter(Boolean).map((m) => m[1]);
}
