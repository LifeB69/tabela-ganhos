// Tabela de Ganhos v2 — tela Mais: peças pequenas usadas por todas as seções.
import { h, idUnico } from '../../ui/el.js';

/** Nomes dos estados, para a lista de UF. */
export const NOMES_UF = Object.freeze({
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal',
  ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso',
  PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco', PI: 'Piauí', PR: 'Paraná', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RO: 'Rondônia', RR: 'Roraima', RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins',
});

/** "2026-11-20" -> "20/11/2026". */
export function dataBR(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** Dia anterior de uma data ISO. */
export function diaAnterior(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d - 1)).toISOString().slice(0, 10);
}

/**
 * Seção da tela Mais: <section id="mais-<id>"> com h2 (alvo das sub-rotas #mais/<id>).
 * @returns {HTMLElement}
 */
export function secao({ id, titulo, sub = null, papel = true }, ...filhos) {
  const idTitulo = `mais-${id}-titulo`;
  return h('section', { class: ['bloco', papel && 'bloco--papel', 'mais-secao'], id: `mais-${id}`, 'aria-labelledby': idTitulo, dataset: { secao: id } },
    h('h2', { class: 'bloco-titulo', id: idTitulo, tabindex: '-1' }, titulo),
    sub ? h('p', { class: 'bloco-sub' }, sub) : null,
    ...filhos);
}

/** Subtítulo dentro de uma seção (h3). */
export function subtitulo(texto, extra = null) {
  return h('h3', { class: 'mais-h3' }, texto, extra);
}

/**
 * Interruptor liga/desliga: <input type="checkbox" role="switch"> dentro do rótulo (alvo de toque da linha toda).
 * @returns {HTMLLabelElement} com .input, .definir(bool)
 */
export function interruptor({ rotulo, dica = null, ligado = false, aoMudar = null, desativado = false }) {
  const id = idUnico('interruptor');
  const idDica = dica ? `${id}-dica` : null;
  const input = h('input', {
    type: 'checkbox', role: 'switch', id, class: 'mais-switch-input', checked: !!ligado, disabled: desativado,
    'aria-describedby': idDica,
  });
  const raiz = h('label', { class: 'mais-switch', for: id },
    h('span', { class: 'mais-switch-textos' },
      h('span', { class: 'mais-switch-rotulo' }, rotulo),
      dica ? h('span', { class: 'mais-switch-dica', id: idDica }, dica) : null),
    input,
    h('span', { class: 'mais-switch-trilho', 'aria-hidden': 'true' }, h('span', { class: 'mais-switch-bola' })));
  if (aoMudar) input.addEventListener('change', () => aoMudar(input.checked));
  raiz.input = input;
  raiz.definir = (v) => { input.checked = !!v; };
  return raiz;
}

/** Linha de status discreta ("Guardado.") com região viva educada. */
export function status() {
  const p = h('p', { class: 'mais-status', 'aria-live': 'polite' });
  let timer = null;
  p.mostrar = (texto) => {
    clearTimeout(timer);
    p.textContent = texto;
    timer = setTimeout(() => { p.textContent = ''; }, 4000);
  };
  return p;
}

/** Espera `ms` depois da última chamada antes de rodar fn. */
export function adiar(fn, ms = 500) {
  let t = null;
  const f = (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  f.agora = (...args) => { clearTimeout(t); fn(...args); };
  f.cancelar = () => clearTimeout(t);
  return f;
}

/** Lê e grava no localStorage sem lançar erro (janela anônima, armazenamento bloqueado). */
export function lsLer(k) { try { return localStorage.getItem(k); } catch { return null; } }
export function lsGravar(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }
export function lsApagar(k) { try { localStorage.removeItem(k); } catch { /* nada */ } }
