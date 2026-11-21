// Tabela de Ganhos v2 — tela "Salvos": os cálculos guardados neste aparelho.
// Lista com busca, filtros (modo, etiqueta), ordem e fixados no topo; abrir, editar, duplicar, fixar,
// compartilhar (link só com números) e apagar com "Desfazer"; backup JSON, CSV e restauração com prévia.
// Contrato: docs/ARQUITETURA-UI.md. Texto do usuário entra sempre como texto (ui.h), nunca como HTML.
import {
  filtrar, ordenar, etiquetasUsadas, lerEtiquetas, dataBR, dataLocalBR, trecho, montarCsv,
  deveLembrarBackup, previaImportacao, plural, semAcento, DIAS_ADIAR,
} from './salvos/util.js';
import { ultimoBackup, marcarBackup, adiadoAte, adiarLembrete, baixarArquivo, lerBackup } from './salvos/backup.js';

const MODOS = ['porHora', 'inverso', 'diarista', 'domestico'];
const PASSO_LISTA = 50;

let instancia = null;

/** @param {HTMLElement} raiz  @param {object} ctx */
export async function montar(raiz, ctx) {
  await ctx.carregarCss('css/telas/salvos.css');
  instancia = criarTela(raiz, ctx);
  await instancia.iniciar(ctx.rota);
}

export async function aoMudarRota(rota) {
  if (instancia) await instancia.aoMudarRota(rota);
}

export function desmontar() {
  if (instancia) instancia.desmontar();
  instancia = null;
}

function criarTela(raiz, ctx) {
  const { ui, armazem, motor } = ctx;
  const { h } = ui;
  const nomesModo = (ctx.nomes && ctx.nomes.modo) || {};
  const nomeModo = (m) => nomesModo[m] || m;
  let montado = true;

  const E = {
    lista: [],          // todos os salvos (do armazém)
    busca: '',
    modo: null,         // null = todos
    etiqueta: null,     // null = todas
    ordem: 'recentes',  // 'recentes' | 'titulo'
    limite: PASSO_LISTA,
    importacao: null,   // prévia aberta
  };

  // ───────────── estrutura fixa ─────────────
  const avisoTemporario = h('div', { class: 'salvos-aviso-temp' });
  const lembrete = h('div', { class: 'salvos-lembrete' });

  const campoBusca = ui.campoTexto({
    rotulo: 'Buscar nos salvos', tipo: 'search', maximo: 100, placeholder: 'Título, nota ou etiqueta',
    aoMudar: (v) => { E.busca = v; E.limite = PASSO_LISTA; agendarLista(); },
  });
  campoBusca.input.setAttribute('enterkeyhint', 'search');
  const filtros = h('div', { class: 'salvos-filtros' });
  const ordem = ui.segmentos({
    rotulo: 'Ordem', variante: 'colado', valor: E.ordem,
    opcoes: [{ valor: 'recentes', texto: 'Mais recentes' }, { valor: 'titulo', texto: 'Título (A a Z)' }],
    aoMudar: (v) => { E.ordem = v; desenharLista(); },
  });
  const controles = h('div', { class: 'bloco salvos-controles' }, campoBusca, filtros, ordem);

  const situacao = h('p', { class: 'salvos-situacao', role: 'status' });
  const listaEl = h('div', { class: 'salvos-lista-caixa' });

  const tituloBackup = h('h2', { class: 'bloco-titulo', id: 'salvos-backup-titulo', tabindex: '-1' }, 'Backup e planilha');
  const acoesExportar = h('div', { class: 'grupo-botoes salvos-exportar' });
  const entradaArquivo = h('input', {
    type: 'file', accept: '.json,application/json', class: 'sr', tabindex: '-1', 'aria-hidden': 'true', id: 'salvos-arquivo',
    on: { change: aoEscolherArquivo },
  });
  const painelImportar = h('div', { class: 'salvos-importar-caixa' });
  const blocoBackup = h('section', { class: 'bloco bloco--papel salvos-backup', 'aria-labelledby': 'salvos-backup-titulo' },
    tituloBackup,
    h('p', { class: 'bloco-sub salvos-backup-texto' },
      'Os salvos ficam só neste aparelho. O backup é um arquivo com todos eles; guarde no e-mail, na nuvem ou no computador e use "Restaurar" em outro aparelho.'),
    acoesExportar,
    h('div', { class: 'grupo-botoes' },
      ui.botao({ texto: 'Restaurar de um backup', icone: 'enviar', aoClicar: () => entradaArquivo.click() })),
    entradaArquivo,
    painelImportar);

  raiz.append(h('section', { class: 'tela', 'aria-labelledby': 'titulo-tela' },
    ui.cabecalhoTela({ titulo: 'Salvos', sub: 'Os cálculos que você guardou. Ficam só neste aparelho.' }),
    avisoTemporario,
    lembrete,
    controles,
    situacao,
    listaEl,
    blocoBackup));

  // ───────────── dados ─────────────
  async function recarregar() {
    E.lista = await armazem.listarSalvos();
    if (!montado) return;
    // Filtro que não existe mais (etiqueta ou modo sumiu depois de apagar) volta para "todos".
    if (E.etiqueta && !E.lista.some((s) => s.etiquetas.some((t) => semAcento(t) === semAcento(E.etiqueta)))) E.etiqueta = null;
    if (E.modo && !E.lista.some((s) => s.modo === E.modo)) E.modo = null;
    desenharTudo();
  }

  function desenharTudo() {
    desenharAvisos();
    desenharFiltros();
    desenharExportar();
    desenharLista();
  }

  function desenharAvisos() {
    ui.trocar(avisoTemporario, armazem.temporario ? ui.alerta({
      nivel: 'atencao',
      titulo: 'Neste navegador, os salvos somem ao fechar o app',
      texto: 'O navegador está em modo anônimo ou bloqueia o armazenamento. Faça um backup antes de fechar, ou abra o app numa janela normal.',
    }) : null);
    const lembrar = !armazem.temporario && deveLembrarBackup({ quantos: E.lista.length, ultimoBackup: ultimoBackup(ctx), adiadoAte: adiadoAte(ctx) });
    const ultimo = ultimoBackup(ctx);
    ui.trocar(lembrete, lembrar ? ui.alerta({
      nivel: 'info',
      titulo: 'Que tal fazer um backup?',
      texto: `Você tem ${plural(E.lista.length, 'cálculo salvo', 'cálculos salvos')} e ${ultimo ? `o último backup foi em ${dataLocalBR(ultimo)}` : 'ainda não fez backup'}. Se o aparelho for perdido ou o navegador for limpo, eles se perdem.`,
      acoes: [
        { texto: 'Fazer backup', aoClicar: exportarBackup },
        { texto: 'Lembrar depois', variante: 'texto', aoClicar: async () => { await adiarLembrete(ctx, DIAS_ADIAR); desenharAvisos(); ctx.anunciar(`Vou lembrar de novo em ${DIAS_ADIAR} dias.`); focarTitulo(); } },
      ],
    }) : null);
  }

  function desenharFiltros() {
    const vazio = E.lista.length === 0;
    controles.hidden = vazio;
    situacao.hidden = vazio;
    if (vazio) { ui.trocar(filtros); return; }

    const modosUsados = MODOS.filter((m) => E.lista.some((s) => s.modo === m));
    const grupoModo = modosUsados.length > 1 ? ui.segmentos({
      rotulo: 'Modo', variante: 'chips', valor: E.modo || 'todos',
      opcoes: [{ valor: 'todos', texto: 'Todos' }, ...modosUsados.map((m) => ({ valor: m, texto: nomeModo(m) }))],
      aoMudar: (v) => { E.modo = v === 'todos' ? null : v; E.limite = PASSO_LISTA; desenharLista(); },
    }) : null;

    const etiquetas = etiquetasUsadas(E.lista);
    let grupoEtiqueta = null;
    if (etiquetas.length && etiquetas.length <= 12) {
      const atual = E.etiqueta ? (etiquetas.find((t) => semAcento(t.texto) === semAcento(E.etiqueta)) || {}).texto : null;
      grupoEtiqueta = ui.segmentos({
        rotulo: 'Etiqueta', variante: 'chips', valor: atual || '',
        opcoes: [{ valor: '', texto: 'Todas' }, ...etiquetas.map((t) => ({ valor: t.texto, texto: t.texto }))],
        aoMudar: (v) => { E.etiqueta = v || null; E.limite = PASSO_LISTA; desenharLista(); },
      });
    } else if (etiquetas.length) {
      const atual = E.etiqueta ? (etiquetas.find((t) => semAcento(t.texto) === semAcento(E.etiqueta)) || {}).texto : '';
      grupoEtiqueta = ui.campoSelecao({
        rotulo: 'Etiqueta', valor: atual || '', largo: true,
        opcoes: [{ valor: '', texto: 'Todas as etiquetas' }, ...etiquetas.map((t) => ({ valor: t.texto, texto: `${t.texto} (${t.n})` }))],
        aoMudar: (v) => { E.etiqueta = v || null; E.limite = PASSO_LISTA; desenharLista(); },
      });
    }
    ui.trocar(filtros, grupoModo, grupoEtiqueta);
    ordem.definir(E.ordem);
    if (campoBusca.input.value !== E.busca) campoBusca.input.value = E.busca;
  }

  function desenharExportar() {
    const tem = E.lista.length > 0;
    ui.trocar(acoesExportar, tem ? [
      ui.botao({ texto: 'Fazer backup', icone: 'baixar', variante: 'primario', aoClicar: exportarBackup }),
      ui.botao({ texto: 'Baixar planilha (CSV)', icone: 'tabela', aoClicar: exportarCsv }),
    ] : null);
  }

  // ───────────── lista ─────────────
  let timerBusca = null;
  function agendarLista() { clearTimeout(timerBusca); timerBusca = setTimeout(() => { if (montado) desenharLista(); }, 180); }

  function visiveis() {
    return ordenar(filtrar(E.lista, { busca: E.busca, etiqueta: E.etiqueta, modo: E.modo }), E.ordem);
  }

  function desenharLista() {
    if (!E.lista.length) {
      situacao.textContent = '';
      ui.trocar(listaEl, ui.estadoVazio({
        titulo: 'Nenhum cálculo salvo ainda',
        texto: 'Faça uma conta na aba Calcular e toque em "Salvar". Ela aparece aqui, com título, notas e etiquetas, e fica só neste aparelho.',
        icone: 'salvos',
        acao: { texto: 'Ir para a calculadora', href: '#calcular' },
      }));
      return;
    }
    const lista = visiveis();
    const filtrando = !!(E.busca.trim() || E.modo || E.etiqueta);
    situacao.textContent = filtrando
      ? `${plural(lista.length, 'cálculo encontrado', 'cálculos encontrados')} de ${E.lista.length.toLocaleString('pt-BR')}.`
      : `${plural(E.lista.length, 'cálculo salvo', 'cálculos salvos')}.`;
    if (!lista.length) {
      ui.trocar(listaEl, ui.estadoVazio({
        titulo: 'Nada encontrado',
        texto: 'Nenhum salvo combina com a busca e os filtros escolhidos.',
        icone: 'busca',
        acao: { texto: 'Limpar busca e filtros', aoClicar: limparFiltros },
      }));
      return;
    }
    const mostrar = lista.slice(0, E.limite);
    const restantes = lista.length - mostrar.length;
    ui.trocar(listaEl,
      h('ul', { class: 'salvos-lista', 'aria-label': 'Cálculos salvos' }, mostrar.map(item)),
      restantes > 0 ? h('div', { class: 'salvos-mais' }, ui.botao({
        texto: `Mostrar mais ${Math.min(restantes, PASSO_LISTA)} de ${restantes}`, largo: true,
        aoClicar: () => {
          const primeiroNovo = mostrar.length;
          E.limite += PASSO_LISTA;
          desenharLista();
          const alvo = listaEl.querySelectorAll('.salvos-item-titulo')[primeiroNovo];
          if (alvo) alvo.focus();
        },
      })) : null);
  }

  function limparFiltros() {
    E.busca = ''; E.modo = null; E.etiqueta = null; E.limite = PASSO_LISTA;
    campoBusca.input.value = '';
    desenharFiltros();
    desenharLista();
    campoBusca.input.focus();
  }

  function item(s) {
    const idTitulo = `salvo-t-${s.id}`;
    const valor = s.resumo && Number.isFinite(s.resumo.valor_centavos) ? s.resumo.valor_centavos : null;
    const criado = dataLocalBR(s.criado_em);
    const editado = dataLocalBR(s.editado_em);
    const versaoAntiga = s.parametros_versao && s.parametros_versao !== motor.PARAMETROS_VERSAO;
    const descrito = { 'aria-describedby': idTitulo };

    const abrir = h('a', { class: 'botao botao--primario salvos-abrir', href: `#calcular?salvo=${encodeURIComponent(s.id)}`, ...descrito },
      ui.icone('calcular'), 'Abrir');
    const editar = ui.botao({ texto: 'Editar', icone: 'editar', aoClicar: () => abrirEdicao(s) });
    const mais = ui.botao({ texto: 'Mais', icone: 'mais', rotulo: 'Mais ações', aoClicar: () => abrirMaisAcoes(s) });
    editar.setAttribute('aria-describedby', idTitulo);
    mais.setAttribute('aria-describedby', idTitulo);
    mais.setAttribute('aria-haspopup', 'dialog');

    return h('li', { class: ['salvos-item', s.fixado && 'salvos-item--fixado'], dataset: { id: s.id } },
      h('div', { class: 'salvos-item-topo' },
        h('h3', { class: 'salvos-item-titulo', id: idTitulo, tabindex: '-1' }, s.titulo),
        h('p', { class: 'salvos-item-valor' },
          valor === null ? h('span', { class: 'salvos-item-semvalor' }, 'sem valor') : h('span', { class: 'numero' }, motor.formatarBRL(valor)),
          s.resumo && s.resumo.rotulo ? h('small', { class: 'salvos-item-rotulo' }, s.resumo.rotulo) : null)),
      h('p', { class: 'salvos-item-meta' },
        s.fixado ? h('span', { class: 'salvos-fixado' }, ui.icone('fixar', { tamanho: 'p' }), 'Fixado') : null,
        h('span', { class: 'salvos-modo' }, nomeModo(s.modo)),
        h('span', null, criado ? `Salvo em ${criado}` : null, editado && editado !== criado ? ` · editado em ${editado}` : null)),
      s.etiquetas.length ? h('ul', { class: 'salvos-etiquetas', 'aria-label': 'Etiquetas' },
        s.etiquetas.map((t) => h('li', { class: 'salvos-etiqueta' }, t))) : null,
      s.notas.trim() ? h('p', { class: 'salvos-item-nota' }, trecho(s.notas)) : null,
      versaoAntiga ? h('p', { class: 'salvos-item-versao' }, ui.icone('atencao', { tamanho: 'p' }),
        h('span', null, h('span', { class: 'salvos-versao-palavra' }, 'Atenção: '),
          `usou os valores da lei de ${dataBR(s.parametros_versao) || s.parametros_versao}. Abrir refaz a conta com os valores de ${dataBR(motor.PARAMETROS_VERSAO)}.`)) : null,
      h('div', { class: 'salvos-item-acoes' }, abrir, editar, mais));
  }

  function focarItem(id) {
    const alvo = id && document.getElementById(`salvo-t-${id}`);
    if (alvo) { alvo.focus(); return true; }
    return false;
  }
  function focarTitulo() { const t = document.getElementById('titulo-tela'); if (t) t.focus(); }

  /** Garante que um salvo apareça mesmo com filtros (depois de duplicar, desfazer etc.). */
  function garantirVisivel(id) {
    const s = E.lista.find((x) => x.id === id);
    if (!s) return;
    if (!filtrar([s], { busca: E.busca, etiqueta: E.etiqueta, modo: E.modo }).length) {
      E.busca = ''; E.modo = null; E.etiqueta = null;
      campoBusca.input.value = '';
      desenharFiltros();
    }
    const pos = visiveis().findIndex((x) => x.id === id);
    if (pos >= E.limite) E.limite = Math.ceil((pos + 1) / PASSO_LISTA) * PASSO_LISTA;
    desenharLista();
  }

  // ───────────── ações ─────────────
  function abrirEdicao(s) {
    const titulo = ui.campoTexto({ rotulo: 'Título', valor: s.titulo, maximo: 120 });
    const notas = ui.campoTexto({ rotulo: 'Notas', valor: s.notas, multilinha: true, maximo: 5000, dica: 'O que foi combinado, lembretes. Ficam só neste aparelho.' });
    const etiq = ui.campoTexto({ rotulo: 'Etiquetas', valor: s.etiquetas.join(', '), maximo: 400, dica: 'Separe com vírgula. Exemplo: casa, mãe, reforma.' });
    const existentes = etiquetasUsadas(E.lista).map((t) => t.texto);
    let sugestoes = null;
    if (existentes.length) {
      const marcadas = () => { const atuais = lerEtiquetas(etiq.input.value).map(semAcento); return existentes.filter((t) => atuais.includes(semAcento(t))); };
      sugestoes = ui.segmentos({
        rotulo: 'Etiquetas que você já usa', variante: 'chips', multiplo: true, valor: marcadas(),
        opcoes: existentes.slice(0, 20).map((t) => ({ valor: t, texto: t })),
        aoMudar: (escolhidas) => {
          const chaves = new Set(existentes.map(semAcento));
          const livres = lerEtiquetas(etiq.input.value).filter((t) => !chaves.has(semAcento(t)));
          etiq.input.value = [...escolhidas, ...livres].join(', ');
        },
      });
      etiq.input.addEventListener('input', () => sugestoes.definir(marcadas()));
    }
    ui.folha({
      titulo: 'Editar salvo',
      conteudo: h('div', { class: 'salvos-folha pilha', 'data-tela': 'salvos' }, titulo, notas, etiq, sugestoes),
      acoes: [
        { texto: 'Cancelar' },
        {
          texto: 'Salvar mudanças', variante: 'primario',
          aoClicar: async () => {
            const t = titulo.input.value.trim();
            if (!t) { titulo.mostrarErro('Escreva um título, como "Diarista de terça".'); titulo.input.focus(); return false; }
            try {
              await armazem.salvarSalvo({ ...s, titulo: t, notas: notas.input.value, etiquetas: lerEtiquetas(etiq.input.value) });
            } catch (e) { ctx.toast(e.message); return false; }
            await recarregar();
            garantirVisivel(s.id);
            setTimeout(() => focarItem(s.id), 0);
            ctx.toast('Mudanças salvas.');
            return true;
          },
        },
      ],
    });
  }

  function abrirMaisAcoes(s) {
    const f = ui.folha({
      titulo: s.titulo,
      conteudo: (fechar) => {
        const acao = (fn) => () => { fechar(null); setTimeout(fn, 0); };
        return h('div', { class: 'salvos-folha salvos-menu', 'data-tela': 'salvos' },
          h('p', { class: 'salvos-menu-sub' }, `${nomeModo(s.modo)}${s.resumo && Number.isFinite(s.resumo.valor_centavos) ? ` · ${motor.formatarBRL(s.resumo.valor_centavos)}` : ''}`),
          ui.botao({ texto: s.fixado ? 'Desafixar do topo' : 'Fixar no topo', icone: 'fixar', largo: true, aoClicar: acao(() => alternarFixado(s)) }),
          ui.botao({ texto: 'Duplicar', icone: 'copiar', largo: true, aoClicar: acao(() => duplicar(s)) }),
          ui.botao({ texto: 'Compartilhar os números', icone: 'compartilhar', largo: true, aoClicar: acao(() => compartilhar(s)) }),
          ui.botao({ texto: 'Apagar', icone: 'lixeira', variante: 'perigo', largo: true, aoClicar: acao(() => apagar(s)) }));
      },
    });
    return f;
  }

  async function alternarFixado(s) {
    try {
      // Fixar não conta como edição (não muda a ordem por "recentes").
      await armazem.fixarSalvo(s.id, !s.fixado);
    } catch (e) { ctx.toast(e.message); return; }
    await recarregar();
    garantirVisivel(s.id);
    focarItem(s.id);
    ctx.anunciar(s.fixado ? 'Desafixado.' : 'Fixado no topo da lista.');
  }

  async function duplicar(s) {
    let copia;
    try {
      const base = s.titulo.length > 110 ? s.titulo.slice(0, 110).trim() : s.titulo;
      copia = await armazem.salvarSalvo({ ...s, id: undefined, titulo: `${base} (cópia)`, fixado: false });
    } catch (e) { ctx.toast(e.message); return; }
    await recarregar();
    garantirVisivel(copia.id);
    focarItem(copia.id);
    ctx.toast(`Cópia criada: "${copia.titulo}".`);
  }

  function compartilhar(s) {
    let link;
    try { link = ctx.compartilhar.gerarLink({ modo: s.modo, entrada: s.entrada, data: s.data_referencia }); } catch (e) {
      ctx.toast('Não deu para gerar o link deste cálculo.'); return;
    }
    const valor = s.resumo && Number.isFinite(s.resumo.valor_centavos) ? s.resumo.valor_centavos : null;
    // O texto não leva o título nem as notas (podem ter nomes): só o modo e o valor.
    const tituloNeutro = `${nomeModo(s.modo)}: ${s.resumo && s.resumo.rotulo ? s.resumo.rotulo : 'cálculo'}`;
    const texto = ctx.compartilhar.textoWhatsApp({
      titulo: tituloNeutro, data: s.data_referencia, link,
      linhas: valor === null ? [] : [{ rotulo: (s.resumo && s.resumo.rotulo) || 'Valor', valor_centavos: valor }],
    });
    const campoLink = ui.campoTexto({ rotulo: 'Link do cálculo', valor: link, maximo: 4000 });
    campoLink.input.readOnly = true;
    campoLink.input.addEventListener('focus', () => campoLink.input.select());
    const temNativo = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    ui.folha({
      titulo: 'Compartilhar os números',
      conteudo: h('div', { class: 'salvos-folha pilha', 'data-tela': 'salvos' },
        h('p', null, 'O link leva só os números da conta: modo, valores, dias e data. O título, as notas e as etiquetas ficam só neste aparelho.'),
        campoLink,
        h('div', { class: 'grupo-botoes' },
          ui.botao({
            texto: 'Copiar link', icone: 'copiar', variante: 'primario',
            aoClicar: async () => { ctx.toast((await ctx.compartilhar.copiar(link)) ? 'Link copiado.' : 'Não deu para copiar. Toque no link e copie à mão.'); },
          }),
          ui.linkExterno(ctx.compartilhar.linkWhatsApp(texto), 'Enviar pelo WhatsApp', { classe: 'botao', icone: ui.icone('externo', { tamanho: 'p' }) }),
          temNativo ? ui.botao({
            texto: 'Outros apps', icone: 'compartilhar',
            aoClicar: async () => {
              const r = await ctx.compartilhar.compartilharNativo({ titulo: tituloNeutro, texto, url: link });
              if (r === 'copiado') ctx.toast('Texto e link copiados.');
              else if (r === 'falhou') ctx.toast('Não deu para compartilhar. Use "Copiar link".');
            },
          }) : null)),
      acoes: [{ texto: 'Fechar' }],
    });
  }

  async function apagar(s) {
    const lista = visiveis();
    const pos = lista.findIndex((x) => x.id === s.id);
    const vizinho = lista[pos + 1] || lista[pos - 1] || null;
    let apagado;
    try { apagado = await armazem.apagarSalvo(s.id); } catch (e) { ctx.toast(e.message); return; }
    await recarregar();
    if (!(vizinho && focarItem(vizinho.id))) focarTitulo();
    ctx.toast(`"${s.titulo}" apagado.`, {
      desfazer: async () => {
        await armazem.restaurarSalvo(apagado || s);
        if (!montado) return;
        await recarregar();
        garantirVisivel(s.id);
        focarItem(s.id);
        ctx.anunciar('O cálculo voltou para a lista.');
      },
    });
  }

  // ───────────── backup e planilha ─────────────
  async function exportarBackup() {
    try {
      const dados = await armazem.exportarTudo();
      const nome = `tabela-ganhos-backup-${ctx.hoje()}.json`;
      baixarArquivo(JSON.stringify(dados, null, 2), nome, 'application/json');
      await marcarBackup(ctx);
      desenharAvisos();
      ctx.toast(`Backup baixado: ${nome}. Guarde o arquivo num lugar seguro.`, { duracao: 7000 });
    } catch {
      ctx.toast('Não deu para gerar o backup. Tente de novo.');
    }
  }

  function exportarCsv() {
    try {
      const texto = montarCsv(ordenar(E.lista, E.ordem), { nomesModo });
      const nome = `tabela-ganhos-salvos-${ctx.hoje()}.csv`;
      baixarArquivo(texto, nome, 'text/csv;charset=utf-8');
      ctx.toast(`Planilha baixada: ${nome}. Abre no Excel, no LibreOffice e no Google Planilhas. Para restaurar, use o backup (arquivo .json).`, { duracao: 8000 });
    } catch {
      ctx.toast('Não deu para gerar a planilha. Tente de novo.');
    }
  }

  async function aoEscolherArquivo() {
    const arquivo = entradaArquivo.files && entradaArquivo.files[0];
    entradaArquivo.value = '';
    if (!arquivo) return;
    const r = await lerBackup(arquivo);
    if (!montado) return;
    if (!r.ok) { mostrarErroImportacao(r.erro); return; }
    E.importacao = r;
    desenharImportacao();
  }

  function mostrarErroImportacao(msg) {
    E.importacao = null;
    const titulo = h('h3', { class: 'salvos-importar-titulo', id: 'salvos-importar-titulo', tabindex: '-1' }, 'Não deu para restaurar');
    ui.trocar(painelImportar, h('section', { class: 'salvos-importar', 'aria-labelledby': 'salvos-importar-titulo' },
      titulo,
      ui.alerta({ nivel: 'atencao', titulo: msg }),
      h('div', { class: 'grupo-botoes' },
        ui.botao({ texto: 'Escolher outro arquivo', icone: 'enviar', aoClicar: () => entradaArquivo.click() }),
        ui.botao({ texto: 'Fechar', variante: 'texto', aoClicar: fecharImportacao }))));
    titulo.focus();
  }

  function fecharImportacao() {
    E.importacao = null;
    ui.trocar(painelImportar);
    tituloBackup.focus();
  }

  function desenharImportacao() {
    const imp = E.importacao;
    if (!imp) { ui.trocar(painelImportar); return; }
    const p = previaImportacao(imp.salvos, E.lista);
    let modo = 'juntar';
    const titulo = h('h3', { class: 'salvos-importar-titulo', id: 'salvos-importar-titulo', tabindex: '-1' },
      imp.exportadoEm ? `Backup de ${dataLocalBR(imp.exportadoEm)}` : 'Backup escolhido');
    const resumoJuntar = h('ul', { class: 'salvos-previa' },
      h('li', null, h('strong', null, plural(p.novos, 'cálculo novo', 'cálculos novos')), p.novos === 1 ? ' vai entrar na lista.' : ' vão entrar na lista.'),
      p.trocados ? h('li', null, h('strong', null, plural(p.trocados, 'cálculo', 'cálculos')), ` daqui ${p.trocados === 1 ? 'vai ser trocado' : 'vão ser trocados'} pela versão mais nova do backup.`) : null,
      p.iguais ? h('li', null, h('strong', null, plural(p.iguais, 'cálculo', 'cálculos')), p.iguais === 1
        ? ' já está aqui (igual ou mais novo) e fica como está.'
        : ' já estão aqui (iguais ou mais novos) e ficam como estão.') : null,
      imp.ilegiveis ? h('li', null, h('strong', null, plural(imp.ilegiveis, 'item', 'itens')), ` do arquivo não ${imp.ilegiveis === 1 ? 'pôde' : 'puderam'} ser lido${imp.ilegiveis === 1 ? '' : 's'} e ${imp.ilegiveis === 1 ? 'fica' : 'ficam'} de fora.`) : null);
    const resumoTrocar = h('div', { class: 'pilha pilha--curta' },
      ui.alerta({
        nivel: 'risco',
        titulo: E.lista.length === 1 ? 'O cálculo deste aparelho vai ser apagado' : `Os ${E.lista.length.toLocaleString('pt-BR')} cálculos deste aparelho vão ser apagados`,
        texto: `Ficam só os ${p.total.toLocaleString('pt-BR')} do backup. Não dá para desfazer. Se quiser guardar os daqui, faça um backup antes.`,
      }));
    resumoTrocar.hidden = true;
    const escolhaModo = E.lista.length ? ui.segmentos({
      rotulo: 'Como restaurar', variante: 'colado', valor: 'juntar',
      opcoes: [{ valor: 'juntar', texto: 'Juntar com os daqui' }, { valor: 'substituir', texto: 'Trocar tudo' }],
      aoMudar: (v) => { modo = v; resumoJuntar.hidden = v !== 'juntar'; resumoTrocar.hidden = v === 'juntar'; botaoOk.textContent = v === 'juntar' ? 'Restaurar' : 'Apagar os daqui e restaurar'; botaoOk.className = v === 'juntar' ? 'botao botao--primario' : 'botao botao--perigo'; },
    }) : null;
    const idConfig = 'salvos-importar-config';
    const caixaConfig = imp.temConfig ? h('div', { class: 'salvos-marcar' },
      h('input', { type: 'checkbox', id: idConfig, class: 'salvos-marcar-caixa' }),
      h('label', { for: idConfig, class: 'salvos-marcar-rotulo' }, 'Também usar as configurações do backup (aparência, estado e valores padrão)')) : null;
    const botaoOk = ui.botao({ texto: 'Restaurar', variante: 'primario', aoClicar: () => confirmarImportacao(modo, caixaConfig && caixaConfig.querySelector('input').checked) });
    ui.trocar(painelImportar, h('section', { class: 'salvos-importar', 'aria-labelledby': 'salvos-importar-titulo' },
      titulo,
      h('p', null, `O arquivo tem ${plural(p.total, 'cálculo salvo', 'cálculos salvos')}. Confira antes de restaurar:`),
      escolhaModo,
      resumoJuntar,
      resumoTrocar,
      caixaConfig,
      h('div', { class: 'grupo-botoes' }, botaoOk, ui.botao({ texto: 'Cancelar', aoClicar: fecharImportacao }))));
    titulo.focus();
    titulo.scrollIntoView({ block: 'nearest' });
  }

  async function confirmarImportacao(modo, usarConfig) {
    const imp = E.importacao;
    if (!imp) return;
    let r;
    try {
      // A config passa por ctx.salvarConfig (aplica a aparência na hora), não pelo armazém direto.
      r = await armazem.importarTudo(imp.dados, { modo: modo === 'substituir' ? 'substituir' : 'juntar', importarConfig: false });
    } catch (e) { ctx.toast(e.message); return; }
    if (!r.ok) { mostrarErroImportacao(r.mensagem); return; }
    const n = r.salvos_importados;
    let extra = modo === 'substituir' ? '' : (() => {
      const iguais = Math.max(0, r.ignorados - imp.ilegiveis);
      return iguais ? ` ${plural(iguais, 'já estava aqui', 'já estavam aqui')}.` : '';
    })();
    if (imp.ilegiveis) extra += ` ${plural(imp.ilegiveis, 'item não pôde ser lido', 'itens não puderam ser lidos')}.`;
    if (usarConfig && imp.temConfig) {
      try { await ctx.salvarConfig(imp.dados.config); extra += ' Configurações do backup aplicadas.'; } catch { extra += ' As configurações não puderam ser aplicadas.'; }
    }
    if (!montado) return;
    E.importacao = null;
    ui.trocar(painelImportar);
    E.busca = ''; E.modo = null; E.etiqueta = null; E.limite = PASSO_LISTA;
    campoBusca.input.value = '';
    await recarregar();
    ctx.toast(`${plural(n, 'cálculo restaurado', 'cálculos restaurados')}.${extra}`, { duracao: 7000 });
    situacao.scrollIntoView({ block: 'nearest' });
    focarTitulo();
  }

  // ───────────── rota (#salvos?etiqueta=casa&modo=diarista&busca=texto) ─────────────
  function aplicarParametros(rota) {
    const p = rota && rota.params;
    if (!p) return;
    const et = p.get('etiqueta');
    const md = p.get('modo');
    const bs = p.get('busca');
    if (et !== null) E.etiqueta = et.slice(0, 40) || null;
    if (md !== null) E.modo = MODOS.includes(md) ? md : null;
    if (bs !== null) E.busca = bs.slice(0, 100);
    E.limite = PASSO_LISTA;
  }

  return {
    async iniciar(rota) {
      aplicarParametros(rota);
      listaEl.append(h('p', { class: 'carregando' }, 'Carregando os salvos…'));
      await armazem.iniciar().catch(() => null);
      await recarregar();
    },
    async aoMudarRota(rota) {
      aplicarParametros(rota);
      desenharFiltros();
      desenharLista();
      focarTitulo();
    },
    desmontar() {
      montado = false;
      clearTimeout(timerBusca);
    },
  };
}
