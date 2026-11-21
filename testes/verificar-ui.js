// Checagens automáticas de interface (rodam no navegador): contraste WCAG AA do texto,
// contraste 3:1 de bordas de campo/chip, alvos de toque >= 44 px e rolagem lateral do corpo.
// Uso: importe e chame verificar(); ou abra testes/vitrine.html?verificar=1 (ou index.html?verificar=1 com app de teste).
// O relatório sai em <pre id="relatorio"> (JSON) e no console.

function cor(texto) {
  if (!texto) return null;
  let m = texto.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/);
  if (m) {
    let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [Number(m[1]), Number(m[2]), Number(m[3]), a];
  }
  m = texto.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [m[1] * 255, m[2] * 255, m[3] * 255, a];
  }
  return null;
}
function misturar(frente, fundo) {
  const a = frente[3];
  return [frente[0] * a + fundo[0] * (1 - a), frente[1] * a + fundo[1] * (1 - a), frente[2] * a + fundo[2] * (1 - a), 1];
}
function lum([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function razao(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }

/** Fundo efetivo: sobe pelos ancestrais compondo as cores com transparência. */
function fundoDe(el) {
  const camadas = [];
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const c = cor(getComputedStyle(n).backgroundColor);
    if (c && c[3] > 0) { camadas.push(c); if (c[3] >= 1) break; }
  }
  let base = [255, 255, 255, 1];
  const raizBg = cor(getComputedStyle(document.body).backgroundColor);
  if (raizBg && raizBg[3] >= 1) base = raizBg;
  for (let i = camadas.length - 1; i >= 0; i--) base = misturar(camadas[i], base);
  return base;
}
function visivel(el) {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const s = getComputedStyle(el);
  if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
  return !el.closest('.sr, [hidden], [aria-hidden="true"]');
}
function nome(el) {
  const t = (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  return `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''} "${t}"`;
}

export function verificar() {
  const problemas = { contraste: [], bordas: [], alvos: [], rolagem: null };
  const raiz = document.documentElement;
  // 1) rolagem lateral do corpo
  if (raiz.scrollWidth > raiz.clientWidth + 1) {
    const largos = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > raiz.clientWidth + 1 && !e.closest('.tabela-rolavel'))
      .slice(0, 5).map(nome);
    problemas.rolagem = { scrollWidth: raiz.scrollWidth, clientWidth: raiz.clientWidth, culpados: largos };
  }
  // 2) contraste de texto
  const vistos = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    if (!t.textContent.trim()) continue;
    const el = t.parentElement;
    if (!el || vistos.has(el) || !visivel(el) || el.closest('pre#relatorio, script, style, noscript')) continue;
    vistos.add(el);
    const s = getComputedStyle(el);
    const fg = cor(s.color); if (!fg) continue;
    const bg = fundoDe(el);
    const frente = fg[3] < 1 ? misturar(fg, bg) : fg;
    const tam = parseFloat(s.fontSize); const peso = Number(s.fontWeight) || 400;
    const grande = tam >= 24 || (tam >= 18.66 && peso >= 700);
    const minimo = grande ? 3 : 4.5;
    const r = razao(frente, bg);
    if (r < minimo && !el.closest('button:disabled, [aria-disabled="true"]')) problemas.contraste.push({ el: nome(el), razao: Number(r.toFixed(2)), minimo, cor: s.color, fundo: `rgb(${bg.slice(0, 3).map(Math.round).join(',')})` });
  }
  // 3) bordas de campo e chip (não-texto, 3:1)
  for (const el of document.querySelectorAll('.campo-caixa, .chip, .botao:not(.botao--texto):not(.botao--icone)')) {
    if (!visivel(el)) continue;
    const s = getComputedStyle(el);
    const lados = ['Top', 'Right', 'Bottom', 'Left'].filter((l) => parseFloat(s[`border${l}Width`]) > 0);
    if (!lados.length) continue;
    const b = cor(s[`border${lados.includes('Bottom') ? 'Bottom' : lados[0]}Color`]);
    if (!b || b[3] === 0) continue;
    const fundoFora = fundoDe(el.parentElement || el);
    const r = razao(b[3] < 1 ? misturar(b, fundoFora) : b, fundoFora);
    if (r < 3) problemas.bordas.push({ el: nome(el), razao: Number(r.toFixed(2)) });
  }
  // 4) alvos de toque
  for (const el of document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [tabindex="0"]')) {
    if (!visivel(el) || el.classList.contains('pular') || el.closest('.tabela-rolavel table')) continue;
    if (el.matches('[tabindex="0"]') && el.classList.contains('tabela-rolavel')) continue;
    const r = el.getBoundingClientRect();
    if (r.height < 43.5 || r.width < 43.5) problemas.alvos.push({ el: nome(el), largura: Math.round(r.width), altura: Math.round(r.height) });
  }
  const resumo = {
    url: location.pathname + location.search,
    largura: innerWidth,
    visual: raiz.dataset.visual, tema: raiz.dataset.tema,
    ok: !problemas.rolagem && !problemas.contraste.length && !problemas.bordas.length && !problemas.alvos.length,
    ...problemas,
  };
  let pre = document.getElementById('relatorio');
  if (!pre) { pre = document.createElement('pre'); pre.id = 'relatorio'; pre.hidden = true; document.body.appendChild(pre); }
  pre.textContent = JSON.stringify(resumo);
  console.log(`VERIFICAR ${resumo.ok ? 'OK' : 'FALHOU'} ${JSON.stringify(resumo)}`);
  return resumo;
}
