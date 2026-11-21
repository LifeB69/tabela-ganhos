// Tabela de Ganhos v2 — tela "Leis": resumos em linguagem simples, glossário, perguntas frequentes,
// calendário de prazos, "o que mudou" e uma busca única (inclui os salvos deste aparelho).
// Contrato: docs/ARQUITETURA-UI.md. Conteúdo: dados/leis.js. Marcações: js/telas/leis/texto.js.
//
// Rotas:
//   #leis                      índice (busca, consultas, resumos por grupo)
//   #leis/<id-do-resumo>       um resumo (ex.: #leis/dsr)
//   #leis/glossario[/<id>]     glossário (com o termo em destaque)
//   #leis/perguntas[/<id>]     perguntas frequentes (com a pergunta aberta)
//   #leis/prazos               calendário de prazos
//   #leis/mudancas             o que mudou e o que vai mudar
// Cada troca de sub-rota remonta a tela (o roteador põe o foco no h1 e volta ao topo).

import { TEMAS, GRUPOS, GLOSSARIO, PERGUNTAS, PRAZOS, MUDANCAS } from '../../dados/leis.js';
import { partes, textoPlano, normalizar, dataBR, termosDe } from './leis/texto.js';

const MODOS_CALCULADORA = ['porHora', 'diarista', 'domestico'];
const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const ROTULO_TIPO = { tema: 'Resumo', termo: 'Palavra', pergunta: 'Pergunta', prazo: 'Prazo', salvo: 'Salvo' };

// A busca continua igual quando a pessoa abre um resultado e volta.
let buscaGuardada = '';
let timers = [];

export function desmontar() {
  timers.forEach((t) => clearTimeout(t));
  timers = [];
}

/** @param {HTMLElement} raiz  @param {object} ctx */
export async function montar(raiz, ctx) {
  await ctx.carregarCss('css/telas/leis.css');
  const { ui, motor } = ctx;
  const hoje = ctx.hoje();
  const data = ctx.dataReferencia();
  const amb = { motor, data, calculados: calcular(motor, data, hoje) };
  const sub = (ctx.rota && ctx.rota.sub) || '';
  const [parte1, parte2] = sub.split('/');
  const R = { ui, motor, ctx, amb, hoje };

  let conteudo;
  if (!parte1) conteudo = telaIndice(R);
  else if (parte1 === 'glossario') conteudo = telaGlossario(R, parte2);
  else if (parte1 === 'perguntas') conteudo = telaPerguntas(R, parte2);
  else if (parte1 === 'prazos') conteudo = telaPrazos(R);
  else if (parte1 === 'mudancas') conteudo = telaMudancas(R);
  else {
    const tema = TEMAS.find((t) => t.id === parte1);
    if (tema) conteudo = telaTema(R, tema);
    else {
      conteudo = telaIndice(R);
      timers.push(setTimeout(() => ctx.toast('Não achei esse assunto. Veja a lista de resumos.'), 0));
    }
  }
  raiz.append(ui.h('section', { class: 'tela leis', 'aria-labelledby': 'titulo-tela' }, conteudo));
}

// ───────────────────────── Valores calculados pela tela ─────────────────────────

function calcular(motor, data, hoje) {
  const c = {};
  // Próximo DAE: o da competência do mês passado, se ainda não venceu; senão o do mês atual.
  try {
    const [a, m] = hoje.split('-').map(Number);
    const mesPassado = new Date(Date.UTC(a, m - 2, 1)).toISOString().slice(0, 10);
    let v = motor.vencimentoDae(mesPassado).vencimento;
    if (v < hoje) v = motor.vencimentoDae(`${hoje.slice(0, 7)}-01`).vencimento;
    c.proximoDae = { texto: `${dataBR(v)} (${diaDaSemana(v)})`, status: null, iso: v };
  } catch { /* sem data: a marcação aparece como indisponível */ }
  try {
    const min = motor.getParam('salario_minimo', data);
    if (min) {
      const r = motor.calcularDomestico({ salario: min.valor.mensal }, data);
      c.custoMinimo = motor.formatarBRL(r.resultado.custo_mensal);
      c.liquidoMinimo = motor.formatarBRL(r.resultado.liquido);
      c.daeMinimo = motor.formatarBRL(r.resultado.dae);
    }
  } catch { /* idem */ }
  return c;
}

function diaDaSemana(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return DIAS_SEMANA[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
}

function diasAte(motor, de, ate) { return motor.diasEntre(de, ate); }

// ───────────────────────── Texto com marcações ─────────────────────────

/** Monta um texto de dados/leis.js como nós DOM (sem innerHTML). */
function rico(R, texto) {
  const { h } = R.ui;
  return partes(texto, R.amb).map((p) => {
    let no;
    if (p.tipo === 'valor') {
      // "R$ 1.741,00 (previsto)": o número não quebra; a marca "(previsto)" pode ir para a linha de baixo.
      const i = p.status ? p.texto.lastIndexOf(' (') : -1;
      no = i > 0
        ? h('span', { class: ['leis-valor', `leis-valor--${p.status.replace(/_/g, '-')}`] }, h('span', { class: 'leis-valor-num' }, p.texto.slice(0, i)), p.texto.slice(i))
        : h('span', { class: 'leis-valor' }, p.texto);
    }
    else if (p.tipo === 'termo') no = h('span', { class: 'leis-termo' }, p.texto);
    else if (p.tipo === 'falta') no = h('span', { class: 'leis-valor leis-valor--falta' }, p.texto);
    else no = document.createTextNode(p.texto);
    return p.negrito ? h('strong', null, no) : no;
  });
}

function plano(R, texto) { return textoPlano(texto, R.amb); }

function voltar(R, href = '#leis', texto = 'Voltar para Leis') {
  return R.ui.h('a', { class: 'botao botao--texto leis-voltar', href }, R.ui.icone('voltar'), texto);
}

function conferido(R) {
  return `Conferido em ${dataBR(R.motor.DATA_CONFERENCIA)}`;
}

/** Abre a explicação de uma palavra do glossário numa folha. */
function abrirTermo(R, id) {
  const { ui } = R;
  const g = GLOSSARIO.find((x) => x.id === id);
  if (!g) return;
  const tema = g.tema ? TEMAS.find((t) => t.id === g.tema) : null;
  ui.folha({
    titulo: `${g.termo}: ${g.nome}`,
    conteudo: [
      ui.h('p', { class: 'leis-folha-texto' }, rico(R, g.texto)),
      ui.h('ul', { class: 'leis-folha-links' },
        tema ? ui.h('li', null, ui.h('a', { href: `#leis/${tema.id}`, class: 'leis-link-alvo' }, `Ler o resumo: ${tema.titulo}`)) : null,
        ui.h('li', null, ui.h('a', { href: `#leis/glossario/${g.id}`, class: 'leis-link-alvo' }, 'Ver todo o glossário'))),
    ],
  });
}

function chipsDeTermos(R, ids) {
  const { ui } = R;
  const unicos = [...new Set(ids)].filter((id) => GLOSSARIO.some((g) => g.id === id));
  if (!unicos.length) return null;
  return ui.h('div', { class: 'leis-termos' },
    ui.h('h2', { class: 'leis-h-pequeno', id: 'leis-termos-titulo' }, 'Palavras deste resumo'),
    ui.h('ul', { class: 'leis-chips', 'aria-labelledby': 'leis-termos-titulo' },
      unicos.map((id) => {
        const g = GLOSSARIO.find((x) => x.id === id);
        return ui.h('li', null, ui.h('button', {
          type: 'button', class: 'chip leis-chip', 'aria-haspopup': 'dialog',
          'aria-label': `${g.termo}: o que é`, on: { click: () => abrirTermo(R, id) },
        }, g.termo));
      })));
}

/** Botões "Usar na calculadora" de um tema. */
function botoesCalculadora(R, modos) {
  const { ui, ctx } = R;
  const validos = (modos || []).filter((m) => MODOS_CALCULADORA.includes(m));
  return validos.map((m) => ui.h('a', {
    class: 'botao leis-usar', href: `#calcular?modo=${m}`,
    on: { click: (e) => { e.preventDefault(); ctx.navegar(`#calcular?modo=${m}`); } },
  }, ui.icone('calcular'), validos.length > 1 ? `Calcular: ${ctx.nomes.modo[m] || m}` : 'Usar na calculadora'));
}

// ───────────────────────── Índice ─────────────────────────

function telaIndice(R) {
  const { ui, ctx } = R;
  const { h } = ui;
  const proximo = proximosPrazos(R)[0];

  const campo = ui.campoTexto({
    rotulo: 'Buscar', tipo: 'search', maximo: 80, valor: buscaGuardada,
    dica: 'Procura nos resumos, nas palavras, nas perguntas, nos prazos e nos seus salvos.',
  });
  campo.classList.add('leis-busca');
  const resultados = h('div', { class: 'leis-resultados', hidden: true });
  const indice = h('div', { class: 'leis-indice' },
    blocoConsultas(R, proximo),
    GRUPOS.map((g) => blocoGrupo(R, g)));

  const indiceBusca = montarIndiceBusca(R);
  let salvos = null;   // carregados sob demanda
  let pedidoSalvos = null;
  const carregarSalvos = () => {
    if (!pedidoSalvos) {
      pedidoSalvos = Promise.resolve(ctx.armazem.listarSalvos())
        .then((l) => { salvos = Array.isArray(l) ? l : []; })
        .catch(() => { salvos = []; });
    }
    return pedidoSalvos;
  };

  let anuncio = null;
  const buscar = async () => {
    const q = campo.input.value.trim();
    buscaGuardada = q;
    if (!q) {
      resultados.hidden = true;
      ui.trocar(resultados);
      indice.hidden = false;
      return;
    }
    await carregarSalvos();
    if (campo.input.value.trim() !== q) return;   // a pessoa já digitou outra coisa
    const achados = procurar(R, indiceBusca, salvos || [], q);
    ui.trocar(resultados, listaResultados(R, achados, q, () => { campo.input.value = ''; buscar(); campo.input.focus(); }));
    resultados.hidden = false;
    indice.hidden = true;
    clearTimeout(anuncio);
    anuncio = setTimeout(() => ctx.anunciar(achados.length ? `${achados.length} ${achados.length === 1 ? 'resultado' : 'resultados'}` : 'Nada encontrado'), 700);
    timers.push(anuncio);
  };
  let espera = null;
  campo.input.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(buscar, 180); timers.push(espera); });
  campo.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(espera); buscar(); } });
  if (buscaGuardada) buscar();

  const temEditados = Object.keys(ctx.config.overrides || {}).length > 0;
  return [
    ui.cabecalhoTela({ titulo: 'Leis', sub: `Resumos simples, com o link da lei oficial. ${conferido(R)}.` }),
    temEditados ? h('p', { class: 'leis-nota' }, 'Aqui aparecem sempre os valores oficiais. Os que você editou em Mais valem só nas contas.') : null,
    h('div', { class: 'leis-buscar', role: 'search' }, campo),
    resultados,
    indice,
  ];
}

function blocoConsultas(R, proximo) {
  const { ui } = R;
  const { h } = ui;
  const item = (href, icone, titulo, detalhe) => h('li', null,
    h('a', { class: 'leis-atalho', href },
      h('span', { class: 'leis-atalho-icone' }, ui.icone(icone)),
      h('span', { class: 'leis-atalho-texto' }, h('span', { class: 'leis-atalho-titulo' }, titulo), detalhe ? h('span', { class: 'leis-atalho-detalhe' }, detalhe) : null),
      ui.icone('avancar', { classe: 'leis-seta' })));
  return h('nav', { class: 'bloco', 'aria-labelledby': 'leis-consultas' },
    h('h2', { class: 'bloco-titulo', id: 'leis-consultas' }, 'Consultas rápidas'),
    h('ul', { class: 'leis-atalhos' },
      item('#leis/prazos', 'calendario', 'Calendário de prazos',
        proximo ? `Próximo: ${plano(R, proximo.titulo)}, ${dataBR(proximo.data)}` : 'Guias, 13º e mudanças da lei'),
      item('#leis/perguntas', 'info', 'Perguntas frequentes', `${PERGUNTAS.length} perguntas com resposta curta`),
      item('#leis/glossario', 'nota', 'Glossário', 'DSR, DAE, FGTS, divisor e outras palavras'),
      item('#leis/mudancas', 'previsto', 'O que mudou', 'O que mudou na lei e o que vai mudar')));
}

function blocoGrupo(R, grupo) {
  const { h } = R.ui;
  const temas = TEMAS.filter((t) => t.grupo === grupo.id);
  if (!temas.length) return null;
  const idTitulo = `leis-grupo-${grupo.id}`;
  return h('section', { class: 'bloco', 'aria-labelledby': idTitulo },
    h('h2', { class: 'bloco-titulo', id: idTitulo }, grupo.titulo),
    h('ul', { class: 'leis-lista' }, temas.map((t) => h('li', null,
      h('a', { class: 'leis-item', href: `#leis/${t.id}` },
        h('span', { class: 'leis-item-texto' },
          h('span', { class: 'leis-item-titulo' }, t.titulo),
          h('span', { class: 'leis-item-resumo' }, rico(R, t.resumo))),
        R.ui.icone('avancar', { classe: 'leis-seta' }))))));
}

// ───────────────────────── Busca ─────────────────────────

function montarIndiceBusca(R) {
  const itens = [];
  for (const t of TEMAS) {
    const corpo = t.blocos.map((b) => {
      if (typeof b === 'string') return plano(R, b);
      if (b.lista) return b.lista.map((x) => plano(R, x)).join(' ');
      if (b.aviso) return `${plano(R, b.aviso.titulo)} ${plano(R, b.aviso.texto)}`;
      if (b.subtitulo) return plano(R, b.subtitulo);
      return '';
    }).join(' ');
    itens.push({ tipo: 'tema', titulo: t.titulo, resumo: plano(R, t.resumo), href: `#leis/${t.id}`, corpo, extra: `${t.palavras || ''} ${t.vigencia || ''} ${t.fontes.map((f) => f.texto).join(' ')}` });
  }
  for (const g of GLOSSARIO) {
    itens.push({ tipo: 'termo', titulo: `${g.termo}: ${g.nome}`, resumo: plano(R, g.texto), href: `#leis/glossario/${g.id}`, corpo: '', extra: '' });
  }
  for (const p of PERGUNTAS) {
    itens.push({ tipo: 'pergunta', titulo: p.pergunta, resumo: plano(R, p.resposta[0]), href: `#leis/perguntas/${p.id}`, corpo: p.resposta.map((x) => plano(R, x)).join(' '), extra: '' });
  }
  for (const z of PRAZOS) {
    itens.push({ tipo: 'prazo', titulo: plano(R, z.titulo), resumo: plano(R, z.texto), href: '#leis/prazos', corpo: '', extra: 'prazo vencimento calendario data' });
  }
  for (const it of itens) {
    it.nTitulo = paraBusca(it.titulo);
    it.nTudo = paraBusca(`${it.titulo} ${it.resumo} ${it.corpo} ${it.extra}`);
  }
  return itens;
}

/** Texto pronto para busca por começo de palavra: " palavra1 palavra2 ". */
function paraBusca(s) { return ` ${normalizar(s).replace(/(\d)\.(?=\d{3})/g, '$1').replace(/[^a-z0-9]+/g, ' ')} `; }
/** true se alguma palavra do texto começa com o pedaço buscado ("feri" acha "férias"; "ana" não acha "semana"). */
function temPalavra(textoBusca, p) { return textoBusca.includes(` ${p}`); }

function procurar(R, indice, salvos, q) {
  const palavras = paraBusca(q).trim().split(' ').filter(Boolean);
  if (!palavras.length) return [];
  const achados = [];
  for (const it of indice) {
    if (!palavras.every((p) => temPalavra(it.nTudo, p))) continue;
    let nota = 0;
    for (const p of palavras) nota += temPalavra(it.nTitulo, p) ? 3 : 1;
    if (it.tipo === 'tema') nota += 1;
    achados.push({ ...it, nota });
  }
  const { motor, ctx } = R;
  for (const s of salvos) {
    if (!s || typeof s !== 'object') continue;
    const etiquetas = Array.isArray(s.etiquetas) ? s.etiquetas.map(String) : [];
    const nomeModo = (ctx.nomes.modo && ctx.nomes.modo[s.modo]) || '';
    const tudo = paraBusca(`${s.titulo || ''} ${s.notas || ''} ${etiquetas.join(' ')} ${nomeModo} ${(s.resumo && s.resumo.rotulo) || ''}`);
    if (!palavras.every((p) => temPalavra(tudo, p))) continue;
    const valor = s.resumo && Number.isFinite(s.resumo.valor_centavos) ? `${s.resumo.rotulo || 'Valor'}: ${motor.formatarBRL(s.resumo.valor_centavos)}` : '';
    const partesResumo = [nomeModo, valor, etiquetas.length ? `etiquetas: ${etiquetas.join(', ')}` : ''].filter(Boolean);
    let nota = 0;
    const tituloBusca = paraBusca(s.titulo || '');
    for (const p of palavras) nota += temPalavra(tituloBusca, p) ? 3 : 1;
    achados.push({ tipo: 'salvo', titulo: String(s.titulo || 'Cálculo sem título'), resumo: partesResumo.join(' · '), href: `#calcular?salvo=${encodeURIComponent(String(s.id || ''))}`, nota });
  }
  const ordemTipo = { tema: 0, pergunta: 1, termo: 2, prazo: 3, salvo: 4 };
  return achados.sort((a, b) => b.nota - a.nota || ordemTipo[a.tipo] - ordemTipo[b.tipo]).slice(0, 40);
}

function listaResultados(R, achados, q, limpar) {
  const { ui } = R;
  const { h } = ui;
  const titulo = achados.length
    ? `${achados.length} ${achados.length === 1 ? 'resultado' : 'resultados'} para "${q}"`
    : `Nada encontrado para "${q}"`;
  return [
    h('div', { class: 'leis-resultados-cab' },
      h('h2', { class: 'bloco-titulo', id: 'leis-resultados-titulo' }, titulo),
      ui.botao({ texto: 'Limpar busca', icone: 'fechar', variante: 'texto', aoClicar: limpar })),
    achados.length
      ? h('ul', { class: 'leis-lista', 'aria-labelledby': 'leis-resultados-titulo' }, achados.map((a) => h('li', null,
        h('a', { class: 'leis-item', href: a.href },
          h('span', { class: 'leis-item-texto' },
            h('span', { class: ['leis-tipo', `leis-tipo--${a.tipo}`] }, ROTULO_TIPO[a.tipo]),
            h('span', { class: 'leis-item-titulo' }, a.titulo),
            a.resumo ? h('span', { class: 'leis-item-resumo' }, a.resumo) : null),
          ui.icone('avancar', { classe: 'leis-seta' })))))
      : h('p', { class: 'leis-nota' }, 'Tente uma palavra mais curta, como "férias", "guia" ou "diarista".'),
  ];
}

// ───────────────────────── Um resumo ─────────────────────────

function telaTema(R, tema) {
  const { ui } = R;
  const { h } = ui;
  const termos = [];
  const juntarTermos = (t) => termos.push(...termosDe(t));
  const blocos = tema.blocos.map((b) => {
    if (typeof b === 'string') { juntarTermos(b); return h('p', { class: 'leis-p' }, rico(R, b)); }
    if (b.lista) { b.lista.forEach(juntarTermos); return h('ul', { class: 'leis-ul' }, b.lista.map((x) => h('li', null, rico(R, x)))); }
    if (b.subtitulo) return h('h2', { class: 'leis-h2' }, b.subtitulo);
    if (b.aviso) { juntarTermos(b.aviso.texto); return ui.alerta({ nivel: b.aviso.nivel, titulo: plano(R, b.aviso.titulo), texto: plano(R, b.aviso.texto) }); }
    return null;
  });
  const [principal, ...outras] = tema.fontes;
  const perguntas = PERGUNTAS.filter((p) => p.tema === tema.id);
  const calcular = botoesCalculadora(R, tema.modos);

  return [
    ui.cabecalhoTela({ titulo: tema.titulo, sub: plano(R, tema.resumo) }),
    voltar(R),
    h('p', { class: 'leis-meta' },
      ui.icone('calendario', { tamanho: 'p' }),
      h('span', null, `${tema.vigencia}. ${conferido(R)}.`)),
    h('article', { class: 'bloco bloco--papel leis-artigo', 'aria-label': `Resumo: ${tema.titulo}` }, blocos),
    h('div', { class: 'leis-acoes' },
      principal ? h('div', { class: 'leis-lei' },
        ui.linkExterno(principal.url, 'Ler na lei oficial', { classe: 'botao botao--primario', icone: ui.icone('externo') }),
        h('span', { class: 'leis-lei-nome' }, principal.texto)) : null,
      calcular),
    chipsDeTermos(R, termos),
    outras.length ? h('section', { class: 'bloco', 'aria-labelledby': 'leis-fontes' },
      h('h2', { class: 'leis-h-pequeno', id: 'leis-fontes' }, 'Outras fontes'),
      h('ul', { class: 'leis-fontes' }, outras.map((f) => h('li', null,
        ui.linkExterno(f.url, f.texto, { classe: 'leis-link-alvo', icone: ui.icone('externo', { tamanho: 'p' }) }))))) : null,
    perguntas.length ? h('section', { class: 'bloco', 'aria-labelledby': 'leis-relacionadas' },
      h('h2', { class: 'leis-h-pequeno', id: 'leis-relacionadas' }, 'Perguntas sobre isto'),
      h('ul', { class: 'leis-lista' }, perguntas.map((p) => h('li', null,
        h('a', { class: 'leis-item leis-item--curto', href: `#leis/perguntas/${p.id}` },
          h('span', { class: 'leis-item-titulo' }, p.pergunta),
          ui.icone('avancar', { classe: 'leis-seta' })))))) : null,
  ];
}

// ───────────────────────── Glossário ─────────────────────────

function telaGlossario(R, alvo) {
  const { ui } = R;
  const { h } = ui;
  const ordenado = GLOSSARIO.slice().sort((a, b) => normalizar(a.termo).localeCompare(normalizar(b.termo), 'pt-BR'));
  const lista = h('dl', { class: 'leis-glossario' }, ordenado.map((g) => {
    const tema = g.tema ? TEMAS.find((t) => t.id === g.tema) : null;
    return h('div', { class: ['leis-verbete', g.id === alvo && 'leis-verbete--alvo'], id: `leis-g-${g.id}`, tabindex: g.id === alvo ? '-1' : null },
      h('dt', null, h('span', { class: 'leis-verbete-termo' }, g.termo), h('span', { class: 'leis-verbete-nome' }, g.nome)),
      h('dd', null,
        h('p', null, rico(R, g.texto)),
        tema ? h('a', { class: 'leis-link-alvo', href: `#leis/${tema.id}` }, `Ler o resumo: ${tema.titulo}`) : null));
  }));
  focarDepois(R, alvo ? `leis-g-${alvo}` : null);
  return [
    ui.cabecalhoTela({ titulo: 'Glossário', sub: 'As palavras difíceis, explicadas em poucas linhas.' }),
    voltar(R),
    h('div', { class: 'bloco bloco--papel' }, lista),
  ];
}

/** Depois que o roteador focar o h1, leva o foco ao item pedido na sub-rota. */
function focarDepois(R, id) {
  if (!id) return;
  timers.push(setTimeout(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ block: 'start' });
    el.focus({ preventScroll: true });
  }, 60));
}

// ───────────────────────── Perguntas ─────────────────────────

function telaPerguntas(R, alvo) {
  const { ui } = R;
  const { h } = ui;
  const itens = PERGUNTAS.map((p) => {
    const tema = p.tema ? TEMAS.find((t) => t.id === p.tema) : null;
    return h('details', { class: 'leis-pergunta', id: `leis-p-${p.id}`, open: p.id === alvo },
      h('summary', null, h('span', null, p.pergunta), ui.icone('seta', { classe: 'leis-pergunta-seta' })),
      h('div', { class: 'leis-resposta' },
        p.resposta.map((x) => h('p', null, rico(R, x))),
        h('div', { class: 'leis-resposta-links' },
          tema ? h('a', { class: 'leis-link-alvo', href: `#leis/${tema.id}` }, `Ler o resumo: ${tema.titulo}`) : null,
          p.fonte ? ui.linkExterno(p.fonte.url, p.fonte.texto, { classe: 'leis-link-alvo', icone: ui.icone('externo', { tamanho: 'p' }) }) : null)));
  });
  if (alvo) {
    timers.push(setTimeout(() => {
      const el = document.getElementById(`leis-p-${alvo}`);
      if (!el) return;
      el.scrollIntoView({ block: 'start' });
      el.querySelector('summary').focus({ preventScroll: true });
    }, 60));
  }
  return [
    ui.cabecalhoTela({ titulo: 'Perguntas frequentes', sub: 'Toque na pergunta para ver a resposta.' }),
    voltar(R),
    h('div', { class: 'leis-perguntas' }, itens),
  ];
}

// ───────────────────────── Prazos ─────────────────────────

function dataDaRegra(R, regra) {
  const { motor, hoje } = R;
  if (regra.tipo === 'dae') return R.amb.calculados.proximoDae ? R.amb.calculados.proximoDae.iso : null;
  if (regra.tipo === 'data') return regra.data;
  if (regra.tipo === 'vigencia') {
    const v = motor.listarVigencias(regra.chave)[regra.indice];
    return v ? v.vigente_desde : null;
  }
  if (regra.tipo === 'anual') {
    const p = motor.getParam(regra.chave, hoje, {}, { incluirNaoVerificados: true, incluirPrevistos: true });
    const mmdd = p && p.valor && p.valor[regra.caminho];
    if (!/^\d{2}-\d{2}$/.test(mmdd || '')) return null;
    const ano = Number(hoje.slice(0, 4));
    const neste = `${ano}-${mmdd}`;
    return neste >= hoje ? neste : `${ano + 1}-${mmdd}`;
  }
  return null;
}

function proximosPrazos(R) {
  return PRAZOS.map((z) => ({ ...z, data: dataDaRegra(R, z.regra) }))
    .filter((z) => z.data && z.data >= R.hoje)
    .sort((a, b) => a.data.localeCompare(b.data));
}

function telaPrazos(R) {
  const { ui, motor, hoje } = R;
  const { h } = ui;
  const lista = proximosPrazos(R);
  const itens = lista.map((z) => {
    const faltam = diasAte(motor, hoje, z.data);
    const quando = faltam === 0 ? 'Hoje' : faltam === 1 ? 'Amanhã' : `Faltam ${faltam} dias`;
    const tema = z.tema ? TEMAS.find((t) => t.id === z.tema) : null;
    const [a, m, d] = z.data.split('-');
    return h('li', { class: 'leis-prazo' },
      h('div', { class: 'leis-prazo-data', 'aria-hidden': 'true' },
        h('span', { class: 'leis-prazo-dia' }, d),
        h('span', { class: 'leis-prazo-mes' }, `${m}/${a}`)),
      h('div', { class: 'leis-prazo-corpo' },
        h('h2', { class: 'leis-prazo-titulo' }, rico(R, z.titulo)),
        h('p', { class: 'leis-prazo-quando' },
          h('span', { class: 'sr' }, `${dataBR(z.data)}, `),
          h('time', { datetime: z.data }, `${diaDaSemana(z.data)}, ${dataBR(z.data)}`), ` · ${quando}`),
        h('p', { class: 'leis-prazo-texto' }, rico(R, z.texto)),
        h('div', { class: 'leis-prazo-rodape' },
          z.recorrente ? h('span', { class: 'selo selo--info' }, z.recorrente) : null,
          z.status ? ui.selo(z.status) : null,
          tema ? h('a', { class: 'leis-link-alvo', href: `#leis/${tema.id}` }, `Ler: ${tema.titulo}`) : null)));
  });
  return [
    ui.cabecalhoTela({ titulo: 'Calendário de prazos', sub: `Os próximos prazos e mudanças, a partir de hoje (${dataBR(hoje)}).` }),
    voltar(R),
    itens.length ? h('ol', { class: 'leis-prazos' }, itens)
      : ui.estadoVazio({ titulo: 'Nenhum prazo à frente', texto: 'Os prazos deste app vão até as datas conferidas.', icone: 'calendario' }),
    h('p', { class: 'leis-nota' }, 'Datas de vencimento consideram fins de semana e feriados nacionais. Feriados da sua cidade podem mudar o dia.'),
  ];
}

// ───────────────────────── O que mudou ─────────────────────────

function formatarValorParam(R, unidade, valor, chave = '') {
  const { motor } = R;
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'object') {
    if (Number.isFinite(valor.mensal)) return `${motor.formatarBRL(valor.mensal)} por mês`;
    return null;
  }
  if (!Number.isFinite(valor)) return String(valor);
  if (unidade === 'centavos') return motor.formatarBRL(valor);
  if (chave === 'divisor_hora') return motor.formatarNumero(valor);
  if (unidade === 'horas') return `${motor.formatarNumero(valor)} horas`;
  if (unidade === 'dias') return `${motor.formatarNumero(valor)} ${valor === 1 ? 'dia' : 'dias'}`;
  if (unidade === 'percentual') return motor.formatarPct(valor);
  return motor.formatarNumero(valor);
}

function telaMudancas(R) {
  const { ui, motor, hoje } = R;
  const { h } = ui;
  const futuras = motor.listarMudancasFuturas(hoje).map((m) => {
    const de = formatarValorParam(R, m.unidade, m.valor_atual, m.chave);
    const para = formatarValorParam(R, m.unidade, m.valor_novo, m.chave);
    const frase = de && para ? `De ${de} para ${para}` : para ? `Passa a ${para}` : '';
    return h('li', { class: 'leis-mudanca' },
      h('p', { class: 'leis-mudanca-data' }, h('time', { datetime: m.vigente_desde }, dataBR(m.vigente_desde))),
      h('div', { class: 'leis-mudanca-corpo' },
        h('h3', { class: 'leis-mudanca-titulo' }, m.rotulo),
        frase ? h('p', null, frase) : null,
        h('div', { class: 'leis-prazo-rodape' },
          ui.selosDoPasso(m),
          m.fonte_url ? ui.linkExterno(m.fonte_url, m.lei || 'Fonte', { classe: 'leis-link-alvo', icone: ui.icone('externo', { tamanho: 'p' }) }) : null)));
  });
  const passadas = MUDANCAS.filter((m) => m.data <= hoje).map((m) => {
    const tema = m.tema ? TEMAS.find((t) => t.id === m.tema) : null;
    return h('li', { class: 'leis-mudanca' },
      h('p', { class: 'leis-mudanca-data' }, h('time', { datetime: m.data }, dataBR(m.data))),
      h('div', { class: 'leis-mudanca-corpo' },
        h('h3', { class: 'leis-mudanca-titulo' }, m.titulo),
        h('p', null, rico(R, m.texto)),
        (m.fonte || tema) ? h('div', { class: 'leis-prazo-rodape' },
          tema ? h('a', { class: 'leis-link-alvo', href: `#leis/${tema.id}` }, `Ler: ${tema.titulo}`) : null,
          m.fonte ? ui.linkExterno(m.fonte, 'Fonte oficial', { classe: 'leis-link-alvo', icone: ui.icone('externo', { tamanho: 'p' }) }) : null) : null));
  });
  return [
    ui.cabecalhoTela({ titulo: 'O que mudou', sub: 'As mudanças na lei que mexem nas contas do app.' }),
    voltar(R),
    h('section', { class: 'bloco', 'aria-labelledby': 'leis-vai-mudar' },
      h('h2', { class: 'bloco-titulo', id: 'leis-vai-mudar' }, 'O que vai mudar'),
      h('p', { class: 'bloco-sub' }, 'O que é previsto aparece aqui, mas só entra nas contas quando virar lei em vigor.'),
      futuras.length ? h('ol', { class: 'leis-mudancas' }, futuras) : h('p', { class: 'leis-nota' }, 'Nenhuma mudança marcada.')),
    h('section', { class: 'bloco', 'aria-labelledby': 'leis-ja-mudou' },
      h('h2', { class: 'bloco-titulo', id: 'leis-ja-mudou' }, 'O que já mudou'),
      h('ol', { class: 'leis-mudancas' }, passadas)),
  ];
}
