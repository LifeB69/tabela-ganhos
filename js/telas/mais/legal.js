// Tabela de Ganhos v2 — tela Mais: Tabela legal (data de referência, valores editáveis, pontos não verificados).
// O motor não muda: a edição grava overrides na config ({ chave: número } ou { jornada_datas }), e o motor
// marca os passos com "editado por você". "Voltar ao oficial" = overrides: { chave: null }.
import { OVERRIDES_ACEITOS } from '../../dados/config.js';
import { secao, subtitulo, dataBR, diaAnterior } from './util.js';

/** Valores que dá para editar aqui (o motor aceita override numérico simples para estes). */
const EDITAVEIS = {
  piso_domestico_SP: { tipo: 'dinheiro', nome: 'Piso do doméstico em SP' },
  piso_domestico_RS: { tipo: 'dinheiro', nome: 'Piso do doméstico no RS' },
  piso_domestico_SC: { tipo: 'dinheiro', nome: 'Piso do doméstico em SC' },
  divisor_hora: { tipo: 'divisor', nome: 'Divisor do salário-hora' },
};

/**
 * Texto para quem usa o app sobre cada ponto não verificado. A "observacao" dos parâmetros é anotação
 * de pesquisa (ex.: "Não afirmar como certo") e não vai para a tela.
 */
const TEXTO_NAO_VERIFICADO = {
  dae_13_vencimento: 'O Manual do eSocial indica o dia 20/01, mas o app ainda não conferiu essa data.',
  dobro_domingo_clt: 'O pagamento em dobro do domingo trabalhado vem de uma súmula do TST que o app ainda não conferiu na fonte.',
  piso_domestico_RJ: 'O valor do piso do RJ não foi conferido na fonte oficial. Ele fica abaixo do mínimo nacional, e a conta usa o mínimo.',
};
const TEXTO_NAO_VERIFICADO_PADRAO = 'Este ponto ainda não foi conferido numa fonte oficial.';

/** A config só guarda os overrides de OVERRIDES_ACEITOS (js/dados/config.js): nunca mostrar um "Editar" que ela descartaria. */
function configAceita(chave) {
  return Object.prototype.hasOwnProperty.call(OVERRIDES_ACEITOS, chave);
}

function campoData({ ui, rotulo, valor, dica = null, min = '2000-01-01', max = '2099-12-31' }) {
  const { h, idUnico } = ui;
  const id = idUnico('data');
  const idDica = dica ? `${id}-dica` : null;
  const idErro = `${id}-erro`;
  const input = h('input', { type: 'date', id, class: 'campo-input', value: valor || '', min, max, 'aria-describedby': [idDica, idErro].filter(Boolean).join(' ') });
  const erro = h('p', { class: 'campo-erro', id: idErro, 'aria-live': 'polite' });
  const raiz = h('div', { class: 'campo campo--largo' },
    h('label', { class: 'campo-rotulo', for: id }, rotulo),
    h('div', { class: 'campo-caixa' }, input),
    dica ? h('p', { class: 'campo-dica', id: idDica }, dica) : null,
    erro);
  raiz.input = input;
  raiz.mostrarErro = (msg) => {
    erro.textContent = msg || '';
    raiz.classList.toggle('campo--erro', !!msg);
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  };
  return raiz;
}

export function montarLegal(ctx) {
  const { ui, motor } = ctx;
  const { h } = ui;

  // ───── Data de referência ─────
  const cfg0 = ctx.config;
  const radioAuto = h('input', { type: 'radio', name: 'mais-data', id: 'mais-data-auto', value: 'auto', class: 'mais-radio', checked: cfg0.dataReferencia === 'auto' });
  const radioFixa = h('input', { type: 'radio', name: 'mais-data', id: 'mais-data-fixa', value: 'fixa', class: 'mais-radio', checked: cfg0.dataReferencia !== 'auto' });
  const textoHoje = h('span', { class: 'mais-opcao-dica' });
  const data = campoData({
    ui, rotulo: 'Data dos cálculos',
    valor: cfg0.dataReferencia !== 'auto' ? cfg0.dataReferencia : ctx.hoje(),
    dica: 'Os valores do app começam em 2026. Para datas anteriores, o cálculo usa os de 2026 e avisa.',
  });
  const caixaData = h('div', { class: 'mais-data-fixa' }, data);
  const efeito = h('p', { class: 'mais-exemplo', 'aria-live': 'polite' });

  const gravarData = async () => {
    if (radioAuto.checked) { await ctx.salvarConfig({ dataReferencia: 'auto' }); return; }
    const v = data.input.value;
    if (!motor.dataValida(v)) { data.mostrarErro('Escolha uma data válida.'); return; }
    data.mostrarErro(null);
    await ctx.salvarConfig({ dataReferencia: v });
  };
  radioAuto.addEventListener('change', gravarData);
  radioFixa.addEventListener('change', () => { gravarData(); if (radioFixa.checked) data.input.focus(); });
  data.input.addEventListener('change', () => { if (!radioFixa.checked) { radioFixa.checked = true; } gravarData(); });

  const grupoData = h('fieldset', { class: 'mais-fieldset' },
    h('legend', { class: 'grupo-rotulo' }, 'Data usada nos cálculos'),
    h('div', { class: 'mais-opcoes' },
      h('label', { class: 'mais-opcao', for: 'mais-data-auto' }, radioAuto,
        h('span', { class: 'mais-opcao-textos' }, h('span', { class: 'mais-opcao-nome' }, 'Automática (hoje)'), textoHoje)),
      h('label', { class: 'mais-opcao', for: 'mais-data-fixa' }, radioFixa,
        h('span', { class: 'mais-opcao-textos' }, h('span', { class: 'mais-opcao-nome' }, 'Escolher uma data'),
          h('span', { class: 'mais-opcao-dica' }, 'Para ver como fica num mês que já passou ou que ainda vai chegar.')))),
    caixaData);

  // ───── Lista de parâmetros ─────
  const lista = h('ul', { class: 'mais-params', role: 'list' });
  const botaoTudo = ui.botao({ texto: 'Voltar tudo ao oficial', icone: 'voltar', variante: 'perigo', aoClicar: voltarTudo });
  const caixaTudo = h('div', { class: 'mais-tudo-oficial' }, botaoTudo);

  // ───── Não verificados ─────
  const naoVerificados = h('ul', { class: 'mais-params', role: 'list' });

  function linhaParam({ chave, rotulo, valor, p, meta = null, editavel = null, extra = null }) {
    const selos = p ? ui.selosDoPasso(p) : [];
    const acoes = [];
    if (editavel) {
      acoes.push(ui.botao({ texto: p && p.editado_por_usuario ? 'Editar de novo' : 'Editar', icone: 'editar', variante: 'secundario', aoClicar: () => editar(chave) }));
      if (p && p.editado_por_usuario) acoes.push(ui.botao({ texto: 'Voltar ao oficial', icone: 'voltar', variante: 'texto', aoClicar: () => voltar(chave) }));
    }
    return h('li', { class: ['mais-param', p && p.editado_por_usuario && 'mais-param--editado'], dataset: { chave } },
      h('div', { class: 'mais-param-cab' }, h('h4', { class: 'mais-param-rotulo' }, rotulo), selos.length ? h('span', { class: 'mais-param-selos' }, selos) : null),
      h('p', { class: 'mais-param-valor numero' }, valor),
      extra,
      meta ? h('p', { class: 'mais-param-meta' }, meta) : null,
      acoes.length ? h('div', { class: 'grupo-botoes mais-param-acoes' }, acoes) : null);
  }

  function linkFonte(url, texto = 'Ver a fonte') {
    return h('span', { class: 'mais-fonte-linha' }, ui.linkExterno(url, texto, { classe: 'mais-fonte-link', icone: ui.icone('externo', { tamanho: 'p' }) }));
  }

  function metaDe(p) {
    if (!p) return null;
    const partes = [];
    // PR: a fonte citada (notícia do governo) não traz a data de início (docs/PENDENCIAS-UI.md).
    const semInicio = p.chave === 'piso_domestico_PR';
    if (p.vigente_desde) partes.push(semInicio ? `Até ${dataBR(p.vigente_ate)} (data de início não confirmada)` : `Desde ${dataBR(p.vigente_desde)}${p.vigente_ate ? ` até ${dataBR(p.vigente_ate)}` : ''}`);
    if (p.lei) partes.push(p.lei);
    return [partes.join(' · '), p.fonte_url ? linkFonte(p.fonte_url) : null];
  }

  function desenhar() {
    const cfg = ctx.config;
    const d = ctx.dataReferencia();
    const ov = ctx.overrides();
    const fmt = motor.formatarBRL;
    textoHoje.textContent = `Hoje é ${dataBR(ctx.hoje())}. Muda sozinha a cada dia.`;
    caixaData.hidden = cfg.dataReferencia === 'auto';
    if (document.activeElement !== data.input && cfg.dataReferencia !== 'auto') data.input.value = cfg.dataReferencia;
    radioAuto.checked = cfg.dataReferencia === 'auto';
    radioFixa.checked = cfg.dataReferencia !== 'auto';

    let j = null;
    try { j = motor.obterJornada(d, ov); } catch { j = null; }
    efeito.textContent = j ? `Em ${dataBR(d)}: jornada de ${j.jornada} h por semana, divisor ${j.divisor} para o salário-hora.` : '';

    const itens = [];
    // Salário mínimo (só leitura: o valor tem mensal, dia e hora juntos)
    const pMin = motor.getParamComReserva('salario_minimo', d, ov);
    if (pMin) {
      itens.push(linhaParam({
        chave: 'salario_minimo', rotulo: 'Salário mínimo', p: pMin, meta: metaDe(pMin),
        valor: [fmt(pMin.valor.mensal), h('span', { class: 'mais-param-unid' }, ' por mês')],
        extra: h('p', { class: 'mais-param-extra' }, `Dia ${fmt(pMin.valor.diario ?? Math.round(pMin.valor.mensal / 30))} · hora ${fmt(motor.horaMinima(d, ov).valor)}`),
      }));
    }
    // Jornada e datas da EC 141 (editáveis)
    const datas = motor.datasJornada(ov);
    const pJ = motor.getParam('jornada_semanal', d, ov.jornada_datas ? { jornada_datas: ov.jornada_datas } : {});
    const editadaJ = !!ov.jornada_datas;
    itens.push(h('li', { class: ['mais-param', editadaJ && 'mais-param--editado'], dataset: { chave: 'jornada_datas' } },
      h('div', { class: 'mais-param-cab' }, h('h4', { class: 'mais-param-rotulo' }, 'Jornada semanal (EC 141)'), editadaJ ? h('span', { class: 'mais-param-selos' }, ui.selo('editado')) : null),
      h('p', { class: 'mais-param-valor numero' }, pJ ? `${pJ.valor} h` : '—', h('span', { class: 'mais-param-unid' }, ` em ${dataBR(d)}`)),
      h('ul', { class: 'mais-etapas', role: 'list' },
        h('li', null, `44 h até ${dataBR(diaAnterior(datas.jornada_42 || '2026-12-16'))}`),
        h('li', null, `42 h a partir de ${dataBR(datas.jornada_42 || '2026-12-16')}`),
        h('li', null, `40 h a partir de ${dataBR(datas.jornada_40 || '2027-12-16')}`)),
      h('p', { class: 'mais-param-meta' }, 'A data muda junto o divisor e os dias de repouso.', linkFonte(motor.FONTES.ec141, 'EC 141/2026')),
      h('div', { class: 'grupo-botoes mais-param-acoes' },
        ui.botao({ texto: 'Mudar as datas', icone: 'calendario', aoClicar: editarDatas }),
        editadaJ ? ui.botao({ texto: 'Voltar ao oficial', icone: 'voltar', variante: 'texto', aoClicar: () => voltar('jornada_datas') }) : null)));
    // Divisor (editável, só menor que o legal)
    const pDivOficial = motor.getParam('divisor_hora', d, ov.jornada_datas ? { jornada_datas: ov.jornada_datas } : {});
    if (pDivOficial) {
      const editado = Object.prototype.hasOwnProperty.call(ov, 'divisor_hora');
      const usado = j ? j.divisor : pDivOficial.valor;
      const pDiv = editado ? { ...pDivOficial, editado_por_usuario: true } : pDivOficial;
      itens.push(linhaParam({
        chave: 'divisor_hora', rotulo: 'Divisor do salário-hora', p: pDiv, meta: metaDe(pDivOficial), editavel: configAceita('divisor_hora'),
        valor: [String(usado), h('span', { class: 'mais-param-unid' }, ' horas por mês')],
        extra: editado ? h('p', { class: 'mais-param-extra' },
          ov.divisor_hora < pDivOficial.valor ? `Oficial: ${pDivOficial.valor}. Você usa ${ov.divisor_hora} (contrato ou convenção).`
            : `Você escolheu ${ov.divisor_hora}, mas só vale divisor menor que o oficial (${pDivOficial.valor}). O cálculo usa ${pDivOficial.valor}.`)
          : h('p', { class: 'mais-param-extra' }, 'Só dá para usar um divisor menor (melhor para quem trabalha), como num contrato ou convenção.'),
      }));
    }
    // Pisos editáveis
    for (const uf of ['SP', 'RS', 'SC']) {
      const chave = `piso_domestico_${uf}`;
      const p = motor.getParam(chave, d, ov);
      const oficial = motor.getParam(chave, d, {});
      if (!p) continue;
      itens.push(linhaParam({
        chave, rotulo: `Piso do doméstico · ${uf}`, p, meta: metaDe(oficial || p), editavel: configAceita(chave),
        valor: [fmt(p.valor), h('span', { class: 'mais-param-unid' }, ' por mês')],
        extra: p.editado_por_usuario ? h('p', { class: 'mais-param-extra' }, `Oficial: ${oficial ? fmt(oficial.valor) : 'sem valor oficial nesta data'}.`) : null,
      }));
    }
    // Piso PR (só leitura: tem 4 grupos)
    const pPR = motor.getParam('piso_domestico_PR', d, {});
    if (pPR && pPR.grupos) {
      itens.push(linhaParam({
        chave: 'piso_domestico_PR', rotulo: 'Piso do doméstico · PR', p: pPR, meta: metaDe(pPR),
        valor: [fmt(pPR.grupos[cfg.grupoPR] || pPR.valor), h('span', { class: 'mais-param-unid' }, ` por mês (Grupo ${cfg.grupoPR})`)],
        extra: h('p', { class: 'mais-param-extra' }, 'Tem quatro grupos; escolha o grupo em Local. Não dá para editar aqui.'),
      }));
    }
    // INSS (só leitura)
    const pInss = motor.getParamComReserva('inss_empregado', d, {});
    if (pInss) {
      const f = pInss.valor.faixas;
      itens.push(linhaParam({
        chave: 'inss_empregado', rotulo: 'INSS de quem trabalha', p: pInss, meta: metaDe(pInss),
        valor: `${motor.formatarPct(f[0].aliquota_pct)} a ${motor.formatarPct(f[f.length - 1].aliquota_pct)}`,
        extra: h('p', { class: 'mais-param-extra' }, `Por faixas, até o teto de ${fmt(pInss.valor.teto)}.`),
      }));
    }
    // Encargos do doméstico (só leitura)
    const pEnc = motor.getParamComReserva('encargos_domestico', d, {});
    if (pEnc) {
      const e = pEnc.valor;
      const total = e.cpp_pct + e.gilrat_pct + e.fgts_pct + e.indenizacao_pct;
      const pct = (n) => motor.formatarPct(n);
      itens.push(linhaParam({
        chave: 'encargos_domestico', rotulo: 'Encargos de quem emprega doméstico', p: pEnc, meta: metaDe(pEnc),
        valor: pct(total),
        extra: h('p', { class: 'mais-param-extra' }, `${pct(e.cpp_pct)} INSS + ${pct(e.gilrat_pct)} seguro de acidente + ${pct(e.fgts_pct)} FGTS + ${pct(e.indenizacao_pct)} reserva da multa. Pagos na guia DAE.`),
      }));
    }
    lista.replaceChildren(...itens);
    caixaTudo.hidden = Object.keys(ov).length === 0;

    // Não verificados (status 'nao_verificado' em alguma vigência)
    const nv = motor.listarParametros().filter((def) => def.vigencias.some((v) => v.status === 'nao_verificado'));
    naoVerificados.replaceChildren(...nv.map((def) => {
      const v = def.vigencias.find((x) => x.status === 'nao_verificado');
      return h('li', { class: 'mais-param mais-param--nv' },
        h('div', { class: 'mais-param-cab' }, h('h4', { class: 'mais-param-rotulo' }, def.rotulo), h('span', { class: 'mais-param-selos' }, ui.selo('nao_verificado'))),
        h('p', { class: 'mais-param-extra' }, TEXTO_NAO_VERIFICADO[def.chave] || TEXTO_NAO_VERIFICADO_PADRAO),
        h('p', { class: 'mais-param-meta' }, v.lei || '', v.fonte_url ? linkFonte(v.fonte_url) : null),
        h('p', { class: 'mais-nv-estado' }, ui.icone('info', { tamanho: 'p' }), ' Fora das contas (desligado).'));
    }));
  }

  // ───── Edição ─────
  async function editar(chave) {
    const def = EDITAVEIS[chave];
    if (!def) return;
    const d = ctx.dataReferencia();
    const ov = ctx.overrides();
    if (def.tipo === 'dinheiro') {
      const oficial = motor.getParam(chave, d, {});
      const atual = motor.getParam(chave, d, ov);
      const campo = ui.campoDinheiro({
        rotulo: `${def.nome} (por mês)`, valor: atual ? atual.valor : null, largo: true, obrigatorio: true,
        dica: `Oficial: ${oficial ? motor.formatarBRL(oficial.valor) : 'sem valor nesta data'}. Use se a convenção da categoria tiver outro valor.`,
      });
      ui.folha({
        titulo: `Editar ${def.nome.toLowerCase()}`,
        conteudo: [campo, h('p', { class: 'campo-dica' }, 'O valor fica marcado "editado por você" em todos os cálculos até você voltar ao oficial.')],
        acoes: [{ texto: 'Cancelar' }, {
          texto: 'Salvar', variante: 'primario',
          aoClicar: async () => {
            const c = campo.lerCentavos();
            if (c === null || c <= 0) { campo.mostrarErro('Escreva um valor maior que zero, como 1.900,00.'); campo.input.focus(); return false; }
            await ctx.salvarConfig({ overrides: { [chave]: c } });
            ctx.toast(`${def.nome}: ${motor.formatarBRL(c)} (editado por você).`, { desfazer: () => ctx.salvarConfig({ overrides: { [chave]: ov[chave] ?? null } }) });
            return undefined;
          },
        }],
      });
    } else if (def.tipo === 'divisor') {
      const oficial = motor.getParam('divisor_hora', d, ov.jornada_datas ? { jornada_datas: ov.jornada_datas } : {});
      const max = oficial ? oficial.valor - 1 : 219;
      const campo = ui.campoNumero({
        rotulo: 'Divisor do salário-hora', valor: Object.prototype.hasOwnProperty.call(ov, 'divisor_hora') ? ov.divisor_hora : max,
        min: 100, max, passo: 1, unidade: 'horas', largo: true,
        dica: `Oficial em ${dataBR(d)}: ${oficial ? oficial.valor : '—'}. Só vale um número menor, que deixa a hora mais cara (melhor para quem trabalha).`,
      });
      ui.folha({
        titulo: 'Editar o divisor',
        conteudo: [campo],
        acoes: [{ texto: 'Cancelar' }, {
          texto: 'Salvar', variante: 'primario',
          aoClicar: async () => {
            const n = campo.lerValor();
            if (n === null || !Number.isInteger(n)) { campo.mostrarErro(`Use um número inteiro entre 100 e ${max}.`); campo.input.focus(); return false; }
            await ctx.salvarConfig({ overrides: { divisor_hora: n } });
            ctx.toast(`Divisor ${n} (editado por você).`, { desfazer: () => ctx.salvarConfig({ overrides: { divisor_hora: ov.divisor_hora ?? null } }) });
            return undefined;
          },
        }],
      });
    }
  }

  function editarDatas() {
    const ov = ctx.overrides();
    const atuais = motor.datasJornada(ov);
    const oficiais = motor.datasJornada({});
    const c42 = campoData({ ui, rotulo: 'Começo das 42 horas', valor: atuais.jornada_42, dica: `Oficial: ${dataBR(oficiais.jornada_42)}. Há quem conte a partir de 17/12/2026.`, min: '2026-10-16', max: '2030-12-31' });
    const c40 = campoData({ ui, rotulo: 'Começo das 40 horas', valor: atuais.jornada_40, dica: `Oficial: ${dataBR(oficiais.jornada_40)}.`, min: '2026-10-16', max: '2032-12-31' });
    ui.folha({
      titulo: 'Datas da mudança de jornada',
      conteudo: [c42, c40, h('p', { class: 'campo-dica' }, 'Use só se um acordo, convenção ou decisão do STF mudar as datas. O cálculo fica marcado "editado por você".')],
      acoes: [{ texto: 'Cancelar' }, {
        texto: 'Salvar', variante: 'primario',
        aoClicar: async () => {
          const a = c42.input.value; const b = c40.input.value;
          c42.mostrarErro(motor.dataValida(a) ? null : 'Escolha uma data válida.');
          c40.mostrarErro(motor.dataValida(b) ? null : 'Escolha uma data válida.');
          if (!motor.dataValida(a) || !motor.dataValida(b)) return false;
          if (b <= a) { c40.mostrarErro('As 40 horas precisam começar depois das 42 horas.'); c40.input.focus(); return false; }
          const novo = {};
          if (a !== oficiais.jornada_42) novo.jornada_42 = a;
          if (b !== oficiais.jornada_40) novo.jornada_40 = b;
          await ctx.salvarConfig({ overrides: { jornada_datas: Object.keys(novo).length ? novo : null } });
          ctx.toast(Object.keys(novo).length ? 'Datas da jornada editadas.' : 'As datas são as oficiais.', { desfazer: () => ctx.salvarConfig({ overrides: { jornada_datas: ov.jornada_datas ?? null } }) });
          return undefined;
        },
      }],
    });
  }

  async function voltar(chave) {
    const ov = ctx.overrides();
    const anterior = ov[chave];
    await ctx.salvarConfig({ overrides: { [chave]: null } });
    ctx.toast('Voltou ao valor oficial.', { desfazer: () => ctx.salvarConfig({ overrides: { [chave]: anterior } }) });
  }

  async function voltarTudo() {
    const ov = ctx.overrides();
    const n = Object.keys(ov).length;
    if (!n) return;
    const ok = await ui.confirmar({
      titulo: 'Voltar tudo ao oficial?',
      texto: `${n === 1 ? 'O valor editado volta' : `Os ${n} valores editados voltam`} ao oficial. Dá para desfazer logo depois.`,
      confirmar: 'Voltar ao oficial',
    });
    if (!ok) return;
    const limpar = Object.fromEntries(Object.keys(ov).map((k) => [k, null]));
    await ctx.salvarConfig({ overrides: limpar });
    ctx.toast('Todos os valores voltaram ao oficial.', { desfazer: () => ctx.salvarConfig({ overrides: ov }) });
  }

  desenhar();

  const elemento = secao({ id: 'tabela-legal', titulo: 'Tabela legal', sub: `Valores de ${motor.anoDosValores(ctx.hoje())}, conferidos em ${dataBR(motor.DATA_CONFERENCIA)}.` },
    grupoData, efeito,
    subtitulo('Valores principais'),
    h('p', { class: 'campo-dica' }, 'Edite só se você tiver certeza, como um valor de contrato ou de convenção coletiva. O que você muda fica marcado "editado por você" e pode voltar ao oficial a qualquer hora.'),
    h('a', { class: 'mais-link-solto', href: '#leis' }, 'Ver todos os valores e leis na aba Leis', ui.icone('avancar', { tamanho: 'p' })),
    lista, caixaTudo,
    subtitulo('Pontos não verificados'),
    h('p', { class: 'campo-dica' }, 'Estes pontos ainda não foram conferidos numa fonte oficial, então eles ficam fora das contas. Quando um cálculo puder usá-los, a opção de ligar aparece aqui, desligada e com este selo.'),
    naoVerificados);

  return {
    elemento,
    atualizar(c, mudou) {
      if (!mudou || mudou.some((k) => ['dataReferencia', 'overrides', 'grupoPR'].includes(k))) desenhar();
    },
  };
}
