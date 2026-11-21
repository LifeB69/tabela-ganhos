// Tabela de Ganhos v2 — tela Mais: Local (UF e grupo do PR), Padrões da calculadora e Arredondamento.
import { secao, status, adiar, NOMES_UF } from './util.js';

const UFS_COM_PISO = ['PR', 'RS', 'SC', 'SP'];

// ───────────── Local ─────────────
export function montarLocal(ctx) {
  const { ui, motor } = ctx;
  const { h } = ui;
  const cfg = ctx.config;

  const uf = ui.campoSelecao({
    rotulo: 'Estado (UF)',
    valor: cfg.uf,
    largo: true,
    opcoes: [{ valor: '', texto: 'Não informar' },
      ...motor.UFS.map((u) => ({ valor: u, texto: `${u} · ${NOMES_UF[u] || u}` }))],
    dica: 'Define o piso do doméstico: o app usa o maior entre o piso do estado e o salário mínimo. Sem estado, vale o mínimo nacional.',
    aoMudar: (v) => ctx.salvarConfig({ uf: v }),
  });

  const grupoPR = ui.campoSelecao({
    rotulo: 'Grupo do piso no Paraná',
    valor: cfg.grupoPR,
    largo: true,
    opcoes: ['I', 'II', 'III', 'IV'].map((g) => ({ valor: g, texto: g === 'II' ? 'Grupo II (padrão)' : `Grupo ${g}` })),
    dica: 'O app usa o Grupo II: é uma dedução pela CBO (a lista oficial de ocupações), que põe o doméstico no grande grupo 5. A convenção coletiva da categoria vale mais.',
    aoMudar: (v) => ctx.salvarConfig({ grupoPR: v }),
  });

  const resumo = h('div', { class: 'mais-piso', 'aria-live': 'polite' });

  function desenharResumo(c) {
    grupoPR.hidden = c.uf !== 'PR';
    const data = ctx.dataReferencia();
    let piso;
    try { piso = motor.pisoDomestico(c.uf || null, data, ctx.overrides(), { grupoPR: c.grupoPR }); } catch { piso = null; }
    if (!piso) { resumo.replaceChildren(); return; }
    const origem = piso.origem === 'piso_uf'
      ? `piso de ${piso.uf}${piso.grupo ? `, Grupo ${piso.grupo}` : ''}`
      : (c.uf ? `salário mínimo nacional (${c.uf} não tem piso estadual maior conferido)` : 'salário mínimo nacional');
    ui.trocar(resumo,
      h('p', { class: 'mais-piso-rotulo' }, `Piso usado em ${dataBRcurta(data)}`),
      h('p', { class: 'mais-piso-valor numero' }, motor.formatarBRL(piso.valor), h('span', { class: 'mais-piso-mes' }, ' por mês')),
      h('p', { class: 'mais-piso-origem texto-2' }, `Vem do ${origem}.`),
      piso.param && piso.param.editado_por_usuario ? h('p', null, ui.selo('editado')) : null,
    );
  }
  desenharResumo(cfg);

  const nota = h('p', { class: 'campo-dica' },
    `Têm piso estadual: ${UFS_COM_PISO.join(', ')}. No PR, o grupo do doméstico e a data de início do piso não foram confirmados em fonte oficial. Nos outros estados vale o mínimo nacional. O piso do RJ não foi verificado e fica fora da conta.`);

  const elemento = secao({ id: 'local', titulo: 'Local', sub: 'Onde a pessoa trabalha.' }, uf, grupoPR, resumo, nota);
  return {
    elemento,
    atualizar(c, mudou) {
      if (document.activeElement !== uf.input) uf.input.value = c.uf;
      if (document.activeElement !== grupoPR.input) grupoPR.input.value = c.grupoPR;
      if (!mudou || mudou.some((k) => ['uf', 'grupoPR', 'overrides', 'dataReferencia'].includes(k))) desenharResumo(c);
    },
  };
}

function dataBRcurta(iso) { const [a, m, d] = iso.split('-'); return `${d}/${m}/${a}`; }

// ───────────── Padrões ─────────────
export function montarPadroes(ctx) {
  const { ui, motor } = ctx;
  const { h } = ui;
  const cfg = ctx.config;
  const st = status();
  const guardar = async (parcial) => {
    await ctx.salvarConfig({ padroes: parcial });
    st.mostrar('Guardado.');
  };
  const guardarAdiado = adiar(guardar, 600);

  const valorHora = ui.campoDinheiro({
    rotulo: 'Valor por hora',
    valor: cfg.padroes.valorHora || null,
    dica: `Já aparece preenchido na calculadora. Deixe vazio para começar em branco. O mínimo hoje é ${motor.formatarBRL(motor.horaMinima(ctx.dataReferencia(), ctx.overrides()).valor)} por hora.`,
    aoMudar: (c, { valido }) => {
      if (valido) guardarAdiado({ valorHora: c === null ? '' : motor.formatarBRL(c, { simbolo: false }) });
    },
  });
  const horasDia = ui.campoNumero({
    rotulo: 'Horas por dia', valor: cfg.padroes.horasDia, min: 0.5, max: 24, passo: 0.5, unidade: 'horas',
    aoMudar: (n) => { if (n !== null) guardarAdiado({ horasDia: n }); },
  });
  const dias = ui.seletorDias({
    rotulo: 'Dias da semana trabalhados',
    valor: cfg.padroes.diasSemana,
    dica: 'Toque para marcar ou desmarcar. D = domingo.',
    aoMudar: (lista) => guardar({ diasSemana: lista }),
  });
  const modo = ui.campoSelecao({
    rotulo: 'A calculadora abre em',
    valor: cfg.padroes.modoInicial,
    largo: true,
    opcoes: ['porHora', 'diarista', 'domestico', 'inverso'].map((m) => ({ valor: m, texto: ctx.nomes.modo[m] })),
    aoMudar: (v) => guardar({ modoInicial: v }),
  });

  const elemento = secao({ id: 'padroes', titulo: 'Padrões da calculadora', sub: 'Os valores que já vêm preenchidos ao abrir o app.' },
    h('div', { class: 'grade-2' }, valorHora, horasDia), dias, modo, st);
  return {
    elemento,
    atualizar(c) {
      const p = c.padroes;
      if (document.activeElement !== valorHora.input) valorHora.definir(p.valorHora || null);
      if (!horasDia.contains(document.activeElement)) horasDia.definir(p.horasDia);
      dias.definir(p.diasSemana);
      if (document.activeElement !== modo.input) modo.input.value = p.modoInicial;
    },
    desmontar() { guardarAdiado.cancelar(); },
  };
}

// ───────────── Arredondamento ─────────────
export function montarArredondamento(ctx) {
  const { ui, motor } = ctx;
  const { h } = ui;
  const cfg = ctx.config;
  const EXEMPLO = 123456;   // R$ 1.234,56
  const passos = { nenhum: 0, '0,50': 50, 1: 100, 5: 500 };
  const exemplo = h('p', { class: 'mais-exemplo' });
  const desenhar = (v) => {
    const r = motor.arredondarPara(EXEMPLO, passos[v] || 0);
    ui.trocar(exemplo,
      'Exemplo: ', h('span', { class: 'numero' }, motor.formatarBRL(EXEMPLO)),
      v === 'nenhum' ? ' fica como está.' : [' aparece como ', h('strong', { class: 'numero' }, motor.formatarBRL(r)), '.']);
  };
  const seg = ui.segmentos({
    rotulo: 'Arredondar o total para',
    variante: 'igual',
    valor: cfg.arredondamento,
    opcoes: [
      { valor: 'nenhum', texto: 'Nenhum', rotulo: 'Nenhum, mostra os centavos' },
      { valor: '0,50', texto: 'R$ 0,50' },
      { valor: '1', texto: 'R$ 1' },
      { valor: '5', texto: 'R$ 5' },
    ],
    aoMudar: (v) => { desenhar(v); ctx.salvarConfig({ arredondamento: v }); },
  });
  seg.classList.add('mais-arred');
  desenhar(cfg.arredondamento);
  const elemento = secao({ id: 'arredondamento', titulo: 'Arredondamento', sub: 'Só muda o total mostrado no modo Por hora. A conta, passo a passo, continua com o valor exato.' },
    seg, exemplo);
  return { elemento, atualizar(c) { seg.definir(c.arredondamento); desenhar(c.arredondamento); } };
}
