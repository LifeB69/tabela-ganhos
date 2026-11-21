// Tabela de Ganhos v2 — campos de formulário: dinheiro, número com − e +, texto, seleção, segmentos/chips.
// Todos devolvem o elemento raiz (div.campo / div.grupo) com métodos extras pendurados nele.
import { parseDinheiro, formatarBRL, formatarNumero } from '../motor/index.js';
import { LIMITE_CENTAVOS } from '../motor/dinheiro.js';
import { h, idUnico } from './el.js';
import { icone } from './icones.js';
import { anunciar } from './basicos.js';

function montarCampo({ id, rotulo, rotuloExtraSr = null, dica, largo, controle, classeExtra = null }) {
  const idDica = dica ? `${id}-dica` : null;
  const idErro = `${id}-erro`;
  const erro = h('p', { class: 'campo-erro', id: idErro, 'aria-live': 'polite' });
  const raiz = h('div', { class: ['campo', largo && 'campo--largo', classeExtra] },
    h('label', { class: 'campo-rotulo', for: id }, rotulo, rotuloExtraSr ? h('span', { class: 'sr' }, rotuloExtraSr) : null),
    controle,
    dica ? h('p', { class: 'campo-dica', id: idDica }, dica) : null,
    erro);
  const describedby = [idDica, idErro].filter(Boolean).join(' ');
  raiz.mostrarErro = (msg) => {
    const input = raiz.input;
    erro.replaceChildren();
    if (msg) { erro.append(icone('atencao', { tamanho: 'p' }), msg); raiz.classList.add('campo--erro'); input && input.setAttribute('aria-invalid', 'true'); }
    else { raiz.classList.remove('campo--erro'); input && input.removeAttribute('aria-invalid'); }
  };
  return { raiz, describedby };
}

/**
 * Campo de dinheiro (texto com teclado numérico). Aceita "1.621,00", "1621", "R$ 1621", "1621,5".
 * Formata como "1.621,00" ao sair do campo. Não aceita negativo nem acima de R$ 1 bilhão.
 * @param {{ rotulo: string, valor?: number|string|null (centavos ou texto), dica?: string, id?: string,
 *           aoMudar?: (centavos: number|null, info: { texto: string, valido: boolean }) => void,
 *           placeholder?: string, largo?: boolean, obrigatorio?: boolean }} opcoes
 * @returns {HTMLDivElement} raiz com: .input, .lerCentavos() -> number|null, .definir(centavos|texto|null), .mostrarErro(msg|null)
 */
export function campoDinheiro({ rotulo, valor = null, dica = null, id = idUnico('dinheiro'), aoMudar = null, placeholder = '0,00', largo = false, obrigatorio = false } = {}) {
  const input = h('input', {
    id, class: 'campo-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false',
    enterkeyhint: 'done', placeholder, required: obrigatorio || null,
  });
  const caixa = h('div', { class: 'campo-caixa' }, h('span', { class: 'campo-prefixo', 'aria-hidden': 'true' }, 'R$'), input);
  const { raiz, describedby } = montarCampo({ id, rotulo, rotuloExtraSr: ' (em reais)', dica, largo, controle: caixa, classeExtra: 'campo--dinheiro' });
  input.setAttribute('aria-describedby', describedby);
  raiz.input = input;

  const ler = () => {
    const texto = input.value.trim();
    if (!texto) return { c: null, motivo: obrigatorio ? 'Preencha este valor.' : null };
    const c = parseDinheiro(texto);
    if (c === null) return { c: null, motivo: 'Escreva só o valor, como 1.621,00.' };
    if (c < 0) return { c: null, motivo: 'O valor não pode ser negativo.' };
    if (c > LIMITE_CENTAVOS) return { c: null, motivo: 'Valor alto demais.' };
    return { c, motivo: null };
  };
  raiz.lerCentavos = () => ler().c;
  raiz.definir = (v) => {
    if (v === null || v === undefined || v === '') input.value = '';
    else if (typeof v === 'number') input.value = formatarBRL(v, { simbolo: false });
    else input.value = String(v);
    raiz.mostrarErro(null);
  };
  raiz.definir(valor);
  if (typeof valor === 'string' && valor) { const { c } = ler(); if (c !== null) input.value = formatarBRL(c, { simbolo: false }); }

  input.addEventListener('input', () => {
    const { c, motivo } = ler();
    if (!motivo) raiz.mostrarErro(null);
    if (aoMudar) aoMudar(c, { texto: input.value, valido: !motivo });
  });
  input.addEventListener('blur', () => {
    const { c, motivo } = ler();
    if (c !== null) input.value = formatarBRL(c, { simbolo: false });
    raiz.mostrarErro(motivo && input.value.trim() ? motivo : null);
  });
  return raiz;
}

/**
 * Campo numérico com botões − e + (horas, dias, dependentes). Aceita vírgula ("4,5").
 * @param {{ rotulo: string, valor?: number, min?: number, max?: number, passo?: number, unidade?: string,
 *           dica?: string, id?: string, aoMudar?: (n: number|null) => void, largo?: boolean }} opcoes
 *   unidade: texto falado depois do número (ex.: 'horas'); aparece só para leitor de tela.
 * @returns {HTMLDivElement} raiz com: .input, .lerValor() -> number|null, .definir(n), .mostrarErro(msg|null)
 */
export function campoNumero({ rotulo, valor = 0, min = 0, max = 999, passo = 1, unidade = '', dica = null, id = idUnico('numero'), aoMudar = null, largo = false } = {}) {
  const decimais = String(passo).includes('.') ? String(passo).split('.')[1].length : 0;
  const input = h('input', {
    id, class: 'campo-input', type: 'text', inputmode: decimais ? 'decimal' : 'numeric', autocomplete: 'off', enterkeyhint: 'done',
  });
  const menos = h('button', { type: 'button', class: 'campo-passo', 'aria-label': `Diminuir ${rotulo.toLowerCase()}` }, icone('menos'));
  const mais = h('button', { type: 'button', class: 'campo-passo', 'aria-label': `Aumentar ${rotulo.toLowerCase()}` }, icone('somar'));
  const caixa = h('div', { class: 'campo-caixa campo-numero' }, menos, input, mais);
  const { raiz, describedby } = montarCampo({ id, rotulo, dica, largo, controle: caixa, classeExtra: 'campo--numero' });
  input.setAttribute('aria-describedby', describedby);
  raiz.input = input;

  const arred = (n) => Math.round(n * 10 ** decimais) / 10 ** decimais;
  const mostrar = (n) => (n === null ? '' : formatarNumero(arred(n)));
  const ler = () => {
    let t = input.value.trim();
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : NaN;
  };
  const atualizarBotoes = (n) => {
    menos.disabled = n !== null && !Number.isNaN(n) && n <= min;
    mais.disabled = n !== null && !Number.isNaN(n) && n >= max;
  };
  raiz.lerValor = () => { const n = ler(); return n === null || Number.isNaN(n) || n < min || n > max ? null : n; };
  raiz.definir = (n) => { input.value = mostrar(n); atualizarBotoes(n); raiz.mostrarErro(null); };
  raiz.definir(valor);

  const passar = (sinal) => {
    const atual = ler();
    const base = atual === null || Number.isNaN(atual) ? min : atual;
    const n = Math.min(max, Math.max(min, arred(base + sinal * passo)));
    raiz.definir(n);
    anunciar(`${rotulo}: ${formatarNumero(n)}${unidade ? ` ${unidade}` : ''}`);
    if (aoMudar) aoMudar(n);
  };
  menos.addEventListener('click', () => passar(-1));
  mais.addEventListener('click', () => passar(1));
  input.addEventListener('input', () => {
    const n = ler();
    if (n === null || (!Number.isNaN(n) && n >= min && n <= max)) raiz.mostrarErro(null);
    atualizarBotoes(n);
    if (aoMudar) aoMudar(raiz.lerValor());
  });
  input.addEventListener('blur', () => {
    const n = ler();
    if (n === null) return;
    if (Number.isNaN(n)) raiz.mostrarErro('Escreva só números.');
    else if (n < min || n > max) raiz.mostrarErro(`Use um número entre ${formatarNumero(min)} e ${formatarNumero(max)}.`);
    else input.value = mostrar(n);
  });
  return raiz;
}

/**
 * Campo de texto livre (título, notas, busca). multilinha = textarea.
 * @returns {HTMLDivElement} raiz com .input, .mostrarErro(msg|null)
 */
export function campoTexto({ rotulo, valor = '', dica = null, id = idUnico('texto'), aoMudar = null, multilinha = false, maximo = 200, placeholder = null, tipo = 'text', largo = true, autocomplete = 'off' } = {}) {
  const input = multilinha
    ? h('textarea', { id, class: 'campo-input', maxlength: String(maximo), placeholder, rows: '4' })
    : h('input', { id, class: 'campo-input', type: tipo, maxlength: String(maximo), placeholder, autocomplete });
  input.value = valor ?? '';
  const caixa = h('div', { class: 'campo-caixa' }, tipo === 'search' ? icone('busca', { classe: 'campo-prefixo' }) : null, input);
  const { raiz, describedby } = montarCampo({ id, rotulo, dica, largo, controle: caixa, classeExtra: 'campo--texto' });
  input.setAttribute('aria-describedby', describedby);
  raiz.input = input;
  if (aoMudar) input.addEventListener('input', () => aoMudar(input.value));
  return raiz;
}

/**
 * Lista de escolha nativa (<select>). opcoes: [{ valor, texto }].
 * @returns {HTMLDivElement} raiz com .input (o select), .mostrarErro
 */
export function campoSelecao({ rotulo, opcoes = [], valor = '', dica = null, id = idUnico('selecao'), aoMudar = null, largo = false } = {}) {
  const select = h('select', { id, class: 'campo-input' },
    opcoes.map((o) => h('option', { value: String(o.valor), selected: String(o.valor) === String(valor) }, o.texto)));
  select.value = String(valor ?? '');
  const caixa = h('div', { class: 'campo-caixa' }, select, icone('seta', { classe: 'campo-seta' }));
  const { raiz, describedby } = montarCampo({ id, rotulo, dica, largo, controle: caixa, classeExtra: 'campo--selecao' });
  select.setAttribute('aria-describedby', describedby);
  raiz.input = select;
  if (aoMudar) select.addEventListener('change', () => aoMudar(select.value));
  return raiz;
}

/**
 * Segmentos / chips: botões que ficam "apertados" (aria-pressed). Um só ou vários (multiplo).
 * variante: 'livre' (quebra linha) | 'igual' (colunas iguais) | 'colado' (segmentado colado) | 'dias' (7 colunas) | 'chips' (pílulas de filtro)
 * opcoes: [{ valor, texto, rotulo?: string (nome completo para leitor de tela, ex.: 'segunda-feira') }]
 * @returns {HTMLDivElement} raiz com: .valor (getter: valor ou lista), .definir(v)
 */
export function segmentos({ rotulo, opcoes = [], valor = null, multiplo = false, aoMudar = null, variante = 'livre', dica = null, rotuloVisivel = true } = {}) {
  const idRotulo = idUnico('grupo');
  let atual = multiplo ? new Set(Array.isArray(valor) ? valor : []) : valor;
  const botoes = opcoes.map((o) => h('button', {
    type: 'button', class: 'chip', 'aria-label': o.rotulo || null, dataset: { valor: String(o.valor) },
  }, o.texto));
  const pintar = () => botoes.forEach((b, i) => {
    const v = opcoes[i].valor;
    b.setAttribute('aria-pressed', String(multiplo ? atual.has(v) : atual === v));
  });
  botoes.forEach((b, i) => b.addEventListener('click', () => {
    const v = opcoes[i].valor;
    if (multiplo) { if (atual.has(v)) atual.delete(v); else atual.add(v); } else atual = v;
    pintar();
    if (aoMudar) aoMudar(raiz.valor);
  }));
  const classeVariante = { livre: 'segmentos', igual: 'segmentos segmentos--igual', colado: 'segmentos segmentos--igual segmentos--colado', dias: 'segmentos segmentos--dias', chips: 'chips' }[variante] || 'segmentos';
  const raiz = h('div', { class: 'grupo' },
    h('span', { class: ['grupo-rotulo', !rotuloVisivel && 'sr'], id: idRotulo }, rotulo),
    h('div', { class: classeVariante, role: 'group', 'aria-labelledby': idRotulo }, botoes),
    dica ? h('p', { class: 'campo-dica' }, dica) : null);
  Object.defineProperty(raiz, 'valor', {
    get: () => (multiplo ? opcoes.map((o) => o.valor).filter((v) => atual.has(v)) : atual),
  });
  raiz.definir = (v) => { atual = multiplo ? new Set(Array.isArray(v) ? v : []) : v; pintar(); };
  pintar();
  return raiz;
}

/** Atalho: os 7 dias da semana (0 = domingo … 6 = sábado), múltipla escolha. */
export function seletorDias({ rotulo = 'Dias da semana', valor = [], aoMudar = null, dica = null } = {}) {
  const dias = [['D', 'domingo'], ['S', 'segunda-feira'], ['T', 'terça-feira'], ['Q', 'quarta-feira'], ['Q', 'quinta-feira'], ['S', 'sexta-feira'], ['S', 'sábado']];
  return segmentos({
    rotulo, multiplo: true, variante: 'dias', valor, aoMudar, dica,
    opcoes: dias.map(([curto, longo], i) => ({ valor: i, texto: curto, rotulo: longo })),
  });
}
