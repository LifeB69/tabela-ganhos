// Tabela de Ganhos v2 — ícones SVG de traço (24×24, espessura 1,75), criados com createElementNS.
// Uso: icone('lei') -> <svg class="icone" aria-hidden="true">…</svg>
//      icone('externo', { tamanho: 'p' })  |  icone('risco', { rotulo: 'Risco' }) (com nome para leitor de tela)

const NS = 'http://www.w3.org/2000/svg';

// Cada ícone: lista de [elemento, atributos].
const DESENHOS = {
  calcular: [['rect', { x: 5, y: 2.5, width: 14, height: 19, rx: 2 }], ['rect', { x: 8, y: 5.5, width: 8, height: 4, rx: 0.6 }], ['path', { d: 'M8.6 13.2h.01M12 13.2h.01M15.4 13.2h.01M8.6 17h.01M12 17h.01M15.4 17h.01', 'stroke-width': 2.4 }]],
  tabela: [['rect', { x: 3, y: 4, width: 18, height: 16, rx: 1.5 }], ['path', { d: 'M3 9h18M3 14.5h18M9 9v11M15 9v11' }]],
  salvos: [['path', { d: 'M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z' }], ['path', { d: 'M9.5 8h5' }]],
  leis: [['path', { d: 'M12 3.5v16M7.5 20.5h9M5 6.5c2.2.9 4.6 1 7 0 2.4 1 4.8.9 7 0' }], ['path', { d: 'M2.6 13.5 5 7l2.4 6.5M16.6 13.5 19 7l2.4 6.5' }], ['path', { d: 'M2.4 13.5a2.6 2 0 0 0 5.2 0zM16.4 13.5a2.6 2 0 0 0 5.2 0z' }]],
  mais: [['path', { d: 'M4 7h9M17.5 7H20M4 17h3.5M12 17h8' }], ['circle', { cx: 15.2, cy: 7, r: 2.2 }], ['circle', { cx: 9.8, cy: 17, r: 2.2 }]],
  externo: [['path', { d: 'M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5' }]],
  seta: [['path', { d: 'M6 9.5l6 6 6-6' }]],
  voltar: [['path', { d: 'M15 5.5 8.5 12l6.5 6.5' }]],
  avancar: [['path', { d: 'M9 5.5l6.5 6.5L9 18.5' }]],
  nota: [['path', { d: 'M5 3.5h10l4 4v13H5z' }], ['path', { d: 'M14.5 3.5V8H19M8.5 12.5h7M8.5 16h5' }]],
  fixar: [['path', { d: 'M9 3.5h6l-1 5.2 3 2.8v2H7v-2l3-2.8zM12 13.5V21' }]],
  busca: [['circle', { cx: 10.8, cy: 10.8, r: 6.3 }], ['path', { d: 'M15.6 15.6l4.9 4.9' }]],
  menos: [['path', { d: 'M6 12h12' }]],
  somar: [['path', { d: 'M6 12h12M12 6v12' }]],
  compartilhar: [['circle', { cx: 6, cy: 12, r: 2.5 }], ['circle', { cx: 18, cy: 5.8, r: 2.5 }], ['circle', { cx: 18, cy: 18.2, r: 2.5 }], ['path', { d: 'M8.3 10.8l7.4-3.8M8.3 13.2l7.4 3.8' }]],
  guardar: [['path', { d: 'M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z' }], ['path', { d: 'M12 7.5v5M9.5 10h5' }]],
  sol: [['circle', { cx: 12, cy: 12, r: 4 }], ['path', { d: 'M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4' }]],
  lua: [['path', { d: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z' }]],
  copiar: [['rect', { x: 8.5, y: 8.5, width: 11.5, height: 11.5, rx: 1.5 }], ['path', { d: 'M15.5 8.5V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v9.5a1 1 0 0 0 1 1h3.5' }]],
  fechar: [['path', { d: 'M6 6l12 12M18 6 6 18' }]],
  lixeira: [['path', { d: 'M4 6.5h16M9.5 6.5V4h5v2.5M6.5 6.5l1 13.5h9l1-13.5M10 10.5v6M14 10.5v6' }]],
  editar: [['path', { d: 'M4 20h4L19 9l-4-4L4 16z' }], ['path', { d: 'M13.5 6.5l4 4' }]],
  imprimir: [['path', { d: 'M7 8V3.5h10V8' }], ['rect', { x: 3.5, y: 8, width: 17, height: 8, rx: 1.5 }], ['path', { d: 'M7 13.5h10v7H7z' }]],
  baixar: [['path', { d: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15' }]],
  enviar: [['path', { d: 'M12 15V4M7.5 8.5 12 4l4.5 4.5M4.5 19.5h15' }]],
  ok: [['path', { d: 'M5 12.5l4.5 4.5L19 7.5' }]],
  // Alertas: cada nível tem forma diferente (não depende só de cor)
  info: [['circle', { cx: 12, cy: 12, r: 9 }], ['path', { d: 'M12 11v6M12 7.5h.01', 'stroke-width': 2.2 }]],
  atencao: [['path', { d: 'M12 3.5 2.5 20h19z' }], ['path', { d: 'M12 10v4.5M12 17.3h.01', 'stroke-width': 2.2 }]],
  risco: [['path', { d: 'M8.2 2.8h7.6l5.4 5.4v7.6l-5.4 5.4H8.2l-5.4-5.4V8.2z' }], ['path', { d: 'M12 7.5v5.5M12 16.3h.01', 'stroke-width': 2.2 }]],
  previsto: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'M12 7.5V12l3 2' }]],
  nao_verificado: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'M9.6 9.5a2.5 2.5 0 1 1 3.3 2.4c-.6.3-.9.8-.9 1.4v.5M12 16.8h.01', 'stroke-width': 2 }]],
  vazio: [['rect', { x: 4, y: 3.5, width: 16, height: 17, rx: 1.5 }], ['path', { d: 'M8 8.5h8M8 12h8M8 15.5h5' }]],
  construcao: [['path', { d: 'M3 20.5h18M5 20.5V13l7-6 7 6v7.5' }], ['path', { d: 'M9.5 20.5v-5h5v5' }]],
  pessoa: [['circle', { cx: 12, cy: 8, r: 3.5 }], ['path', { d: 'M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5' }]],
  calendario: [['rect', { x: 3.5, y: 5, width: 17, height: 15.5, rx: 1.5 }], ['path', { d: 'M3.5 9.5h17M8 3v4M16 3v4' }]],
};

export const NOMES_ICONES = Object.freeze(Object.keys(DESENHOS));

/**
 * @param {string} nome um de NOMES_ICONES
 * @param {{ tamanho?: 'p'|'n'|'g', rotulo?: string, classe?: string }} opcoes
 * @returns {SVGSVGElement}
 */
export function icone(nome, { tamanho = 'n', rotulo = null, classe = null } = {}) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', ['icone', tamanho !== 'n' ? `icone--${tamanho}` : '', classe].filter(Boolean).join(' '));
  svg.setAttribute('focusable', 'false');
  if (rotulo) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', rotulo); } else svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of DESENHOS[nome] || DESENHOS.info) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    svg.appendChild(el);
  }
  return svg;
}
