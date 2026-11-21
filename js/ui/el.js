// Tabela de Ganhos v2 — construtor seguro de elementos. NUNCA usa innerHTML:
// todo texto entra como nó de texto, então texto do usuário nunca vira código.

let _contador = 0;
/** Id único para ligar rótulo, dica e erro (ex.: idUnico('campo') -> "campo-7"). */
export function idUnico(prefixo = 'ui') { _contador += 1; return `${prefixo}-${_contador}`; }

/**
 * Cria um elemento.
 *   h('p', { class: 'dica', id: 'x' }, 'Texto ', h('strong', null, 'forte'))
 * Atributos especiais:
 *   class: string ou lista (falsos são ignorados);  dataset: { chave: valor };
 *   on: { click: fn, input: fn };  aria-*: string;  booleano true -> atributo vazio; false/null -> omitido.
 *   value, checked, disabled, hidden, open, selected: viram propriedades.
 *   style: proibido (a CSP bloqueia estilo em linha) — use classes.
 * Filhos: string/número (vira texto), Node, null/false (ignorado) ou listas desses.
 */
export function h(tag, atributos, ...filhos) {
  const el = document.createElement(tag);
  aplicarAtributos(el, atributos);
  anexar(el, filhos);
  return el;
}

const PROPRIEDADES = new Set(['value', 'checked', 'disabled', 'hidden', 'open', 'selected', 'indeterminate']);

export function aplicarAtributos(el, atributos) {
  if (!atributos) return el;
  for (const [k, v] of Object.entries(atributos)) {
    if (v === undefined || v === null || v === false) {
      if (PROPRIEDADES.has(k) && v === false) el[k] = false;
      continue;
    }
    if (k === 'class') {
      const lista = Array.isArray(v) ? v.filter(Boolean).join(' ') : String(v);
      if (lista) el.setAttribute('class', lista);
    } else if (k === 'dataset') {
      for (const [dk, dv] of Object.entries(v)) if (dv !== undefined && dv !== null) el.dataset[dk] = String(dv);
    } else if (k === 'on') {
      for (const [evento, fn] of Object.entries(v)) if (typeof fn === 'function') el.addEventListener(evento, fn);
    } else if (k === 'style') {
      throw new Error('Use classes CSS: a política de segurança bloqueia style em linha.');
    } else if (k === 'href' || k === 'src') {
      el.setAttribute(k, urlSegura(String(v)));
    } else if (PROPRIEDADES.has(k)) {
      el[k] = v;
    } else if (v === true) {
      el.setAttribute(k, '');
    } else {
      el.setAttribute(k, String(v));
    }
  }
  return el;
}

/** Acrescenta filhos (texto vira nó de texto). */
export function anexar(el, filhos) {
  for (const f of filhos.flat(Infinity)) {
    if (f === null || f === undefined || f === false || f === true) continue;
    el.appendChild(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

/** Troca todo o conteúdo de um elemento. */
export function trocar(el, ...filhos) {
  el.replaceChildren();
  return anexar(el, filhos);
}

/** Só deixa passar http(s), mailto, tel, âncoras (#...) e caminhos relativos. Outros viram "#". */
export function urlSegura(url) {
  const u = url.trim();
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '#';   // javascript:, data:, etc.
  return u;
}

/** Link externo (lei, fonte): nova aba, sem passar referência, com aviso para leitor de tela. */
export function linkExterno(href, texto, { classe = null, icone = null } = {}) {
  const a = h('a', { href, target: '_blank', rel: 'noopener noreferrer', class: classe }, texto);
  if (icone) a.append(' ', icone);
  a.append(h('span', { class: 'sr' }, ' (abre em nova aba)'));
  return a;
}
