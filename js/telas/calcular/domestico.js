// Tabela de Ganhos v2 — tela Calcular, modo "Doméstico" (mensalista ou horista, com carteira).
import { dataBR, mesCurto, semVazios, numeroDe } from './util.js';

/**
 * @param {object} ctx contexto do app
 * @param {{ aoMudar: (imediato?: boolean) => void, dataCalculo: () => string }} api
 */
export function criar(ctx, api) {
  const { ui, motor } = ctx;
  const cfg = ctx.config;
  const mudou = () => api.aoMudar();
  const ja = () => api.aoMudar(true);
  let ufDaConfig = cfg.uf || '';

  const tipo = ui.segmentos({
    rotulo: 'Tipo de contrato', variante: 'igual', valor: 'mensalista',
    opcoes: [{ valor: 'mensalista', texto: 'Mensalista' }, { valor: 'horista', texto: 'Horista' }],
    aoMudar: () => { mostrarTipo(); ja(); },
  });
  const salario = ui.campoDinheiro({ rotulo: 'Salário mensal', dica: 'O valor combinado, antes dos descontos.', aoMudar: mudou });
  const valorHora = ui.campoDinheiro({ rotulo: 'Valor por hora', dica: 'O app soma o repouso semanal (horas por semana × 5).', aoMudar: mudou });
  const horasSemana = ui.campoNumero({
    rotulo: 'Horas por semana', valor: null, min: 1, max: 168, passo: 1, unidade: 'horas', aoMudar: mudou, dica: ' ',
  });
  const dicaHoras = horasSemana.querySelector('.campo-dica');

  const uf = ui.campoSelecao({
    rotulo: 'Estado', valor: ufDaConfig, largo: true,
    opcoes: [{ valor: '', texto: 'Não informar' }, ...motor.UFS.map((u) => ({ valor: u, texto: u }))],
    dica: 'Sem estado, vale o mínimo nacional. Alguns estados têm piso maior.',
    aoMudar: () => { mostrarGrupo(); ja(); },
  });
  const grupoPR = ui.campoSelecao({
    rotulo: 'Grupo do piso no Paraná', valor: cfg.grupoPR, largo: true,
    opcoes: ['I', 'II', 'III', 'IV'].map((g) => ({ valor: g, texto: `Grupo ${g}${g === 'II' ? ' (o mais comum para doméstico)' : ''}` })),
    aoMudar: ja,
  });
  const dependentes = ui.campoNumero({ rotulo: 'Dependentes no IR', valor: 0, min: 0, max: 20, passo: 1, unidade: 'dependentes', aoMudar: mudou });

  // vale-transporte e opções
  const custoVt = ui.campoDinheiro({ rotulo: 'Passagens no mês (vale-transporte)', dica: 'Quanto custam as passagens do mês. Em branco se não houver.', aoMudar: mudou });
  const querVt = ui.segmentos({
    rotulo: 'A pessoa quer o vale?', variante: 'igual', valor: 'sim',
    opcoes: [{ valor: 'sim', texto: 'Sim' }, { valor: 'nao', texto: 'Não, recusou' }],
    dica: 'Quem recusa o vale não tem desconto, e você não paga as passagens.', aoMudar: ja,
  });
  const extras50 = ui.campoNumero({ rotulo: 'Horas extras no mês (50%)', valor: 0, min: 0, max: 300, passo: 0.5, unidade: 'horas', aoMudar: mudou });
  const domingos = ui.campoNumero({ rotulo: 'Horas em domingo ou feriado sem folga', valor: 0, min: 0, max: 300, passo: 1, unidade: 'horas', aoMudar: mudou });
  const comoDomingo = ui.segmentos({
    rotulo: 'Como pagar essas horas', variante: 'igual', valor: 'dobro',
    opcoes: [{ valor: 'dobro', texto: 'Em dobro (padrão da lei)' }, { valor: 'extra', texto: 'Como extra (50%)' }],
    aoMudar: ja,
  });
  const noturnas = ui.campoNumero({
    rotulo: 'Horas entre 22h e 5h no mês', valor: 0, min: 0, max: 300, passo: 0.5, unidade: 'horas',
    dica: 'Horas de relógio. O app conta a hora noturna de 52 min 30 s e soma 20%.', aoMudar: mudou,
  });
  const filhos = ui.campoNumero({ rotulo: 'Filhos até 14 anos (salário-família)', valor: 0, min: 0, max: 20, passo: 1, unidade: 'filhos', aoMudar: mudou });
  const maisOpcoes = ui.h('details', { class: 'calc-mais' },
    ui.h('summary', { class: 'calc-mais-resumo' }, ui.h('span', null, 'Vale-transporte, extras, domingos e noite'), ui.icone('seta')),
    ui.h('div', { class: 'calc-campos calc-mais-corpo' }, custoVt, querVt, extras50, domingos, comoDomingo, noturnas, filhos));

  function mostrarTipo() {
    salario.hidden = tipo.valor !== 'mensalista';
    valorHora.hidden = tipo.valor !== 'horista';
    atualizarDicaHoras();
  }
  function mostrarGrupo() { grupoPR.hidden = uf.input.value !== 'PR'; }
  function atualizarDicaHoras() {
    const j = motor.obterJornada(api.dataCalculo(), ctx.overrides());
    ui.trocar(dicaHoras, tipo.valor === 'horista'
      ? `Horas combinadas por semana. Máximo: ${j.jornada} h por semana.`
      : `Em branco = jornada cheia (${j.jornada} h por semana). Com até 25 h, o contrato é de tempo parcial.`);
  }
  mostrarTipo();
  mostrarGrupo();

  const campos = ui.h('div', { class: 'calc-campos' },
    tipo, salario, valorHora,
    horasSemana,
    ui.h('div', { class: 'grade-2' }, uf, dependentes),
    grupoPR, maisOpcoes);

  function lerEntrada() {
    const e = { tipo: tipo.valor };
    if (tipo.valor === 'mensalista') e.salario = salario.lerCentavos(); else e.valorHora = valorHora.lerCentavos();
    e.horasSemana = horasSemana.lerValor();
    e.uf = uf.input.value || null;
    if (e.uf === 'PR') e.grupoPR = grupoPR.input.value;
    e.dependentes = dependentes.lerValor() || null;
    e.filhosSalarioFamilia = filhos.lerValor() || null;
    e.custoVtMes = custoVt.lerCentavos() || null;
    if (e.custoVtMes && querVt.valor === 'nao') e.recusaVt = true;
    e.horasExtras = extras50.lerValor() || null;
    e.horasDomingoFeriado = domingos.lerValor() || null;
    if (e.horasDomingoFeriado && comoDomingo.valor === 'extra') e.pagarDobroDomingoFeriado = false;
    e.horasNoturnas = noturnas.lerValor() || null;
    return semVazios(e);
  }

  function preencher(e = {}) {
    tipo.definir(e.tipo === 'horista' ? 'horista' : 'mensalista');
    salario.definir(e.salario ?? null);
    valorHora.definir(e.valorHora ?? null);
    horasSemana.definir(numeroDe(e.horasSemana));
    if (typeof e.uf === 'string' && motor.UFS.includes(e.uf)) uf.input.value = e.uf;
    else if (e.uf === undefined || e.uf === null || e.uf === '') uf.input.value = ufDaConfig;
    if (['I', 'II', 'III', 'IV'].includes(e.grupoPR)) grupoPR.input.value = e.grupoPR;
    dependentes.definir(numeroDe(e.dependentes) ?? 0);
    filhos.definir(numeroDe(e.filhosSalarioFamilia) ?? 0);
    custoVt.definir(e.custoVtMes ?? null);
    querVt.definir(e.recusaVt === true ? 'nao' : 'sim');
    extras50.definir(numeroDe(e.horasExtras) ?? 0);
    domingos.definir(numeroDe(e.horasDomingoFeriado) ?? 0);
    comoDomingo.definir(e.pagarDobroDomingoFeriado === false ? 'extra' : 'dobro');
    noturnas.definir(numeroDe(e.horasNoturnas) ?? 0);
    if (e.custoVtMes || e.horasExtras || e.horasDomingoFeriado || e.horasNoturnas || e.filhosSalarioFamilia) maisOpcoes.open = true;
    mostrarTipo();
    mostrarGrupo();
  }

  function calcular(data) {
    atualizarDicaHoras();
    const entrada = lerEntrada();
    const vazios = [];
    let faltando = null;
    if (tipo.valor === 'mensalista' && entrada.salario === undefined) { vazios.push('salario'); faltando = 'Preencha o salário'; }
    if (tipo.valor === 'horista') {
      if (entrada.valorHora === undefined) { vazios.push('valorHora'); faltando = 'Preencha o valor por hora'; }
      if (entrada.horasSemana === undefined) { vazios.push('horasSemana'); faltando = faltando || 'Preencha as horas por semana'; }
    }
    const r = motor.calcularDomestico({ ...entrada, grupoPR: entrada.grupoPR || ctx.config.grupoPR }, data, { overrides: ctx.overrides() });
    const res = r.resultado;
    const venc = res.dae_vencimento ? dataBR(res.dae_vencimento) : '';

    // salário abaixo do piso ou do mínimo: oferece usar o valor da lei
    const alertas = r.alertas.map((a) => ((a.codigo === 'abaixo_piso' || a.codigo === 'abaixo_minimo') && a.nivel === 'risco' && tipo.valor === 'mensalista' && Number.isFinite(a.valor_referencia)
      ? { ...a, acoes: [{ texto: `Usar ${motor.formatarBRL(a.valor_referencia)}`, aoClicar: () => { salario.definir(a.valor_referencia); api.aoMudar(true); } }] }
      : a));

    return {
      r, faltando, vazios, alertas,
      cartao: {
        titulo: 'Você paga por mês', meta: mesCurto(data), valorCentavos: res.custo_mensal, extenso: true,
        linhas: [
          { rotulo: 'A pessoa recebe (líquido)', detalhe: 'já sem o INSS e o IR dela', valorCentavos: res.liquido, grande: true },
          { rotulo: 'Guia DAE', detalhe: venc ? `a guia do eSocial; vence em ${venc}` : 'a guia do eSocial', valorCentavos: res.dae, grande: true },
          { rotulo: 'Custo por ano', detalhe: 'com 13º, férias e 1/3', valorCentavos: res.custo_anual },
          { rotulo: 'Guardar por mês para 13º e férias', detalhe: 'já com os encargos', valorCentavos: res.guardar_por_mes },
        ],
      },
      resumo: { rotulo: 'Você paga por mês', valor_centavos: res.custo_mensal },
      compart: {
        titulo: `Doméstico (${tipo.valor}): você paga por mês`,
        linhas: [
          tipo.valor === 'mensalista' ? { rotulo: 'Salário', valor_centavos: res.salario } : { rotulo: 'Valor por hora', valor_centavos: entrada.valorHora },
          entrada.horasSemana ? { rotulo: 'Horas por semana', texto: motor.formatarNumero(entrada.horasSemana) } : null,
          entrada.uf ? { rotulo: 'Estado', texto: entrada.uf } : null,
          { rotulo: 'Você paga por mês', valor_centavos: res.custo_mensal },
          { rotulo: 'A pessoa recebe (líquido)', valor_centavos: res.liquido },
          { rotulo: venc ? `Guia DAE (vence em ${venc})` : 'Guia DAE', valor_centavos: res.dae },
          { rotulo: 'Custo por ano', valor_centavos: res.custo_anual },
          { rotulo: 'Guardar por mês para 13º e férias', valor_centavos: res.guardar_por_mes },
        ].filter(Boolean),
      },
      anuncio: `Você paga ${motor.formatarBRL(res.custo_mensal)} por mês`,
    };
  }

  /** Estado mudou em Configurações: acompanha, se a pessoa não tinha escolhido outro aqui. */
  function aoMudarConfig(novaCfg) {
    const novo = novaCfg.uf || '';
    if (uf.input.value === ufDaConfig) uf.input.value = novo;
    ufDaConfig = novo;
    if (novaCfg.grupoPR) grupoPR.input.value = novaCfg.grupoPR;
    mostrarGrupo();
  }

  function aplicarExemplo(entrada) { preencher(entrada); }

  return {
    id: 'domestico', campos, extras: null, lerEntrada, preencher, calcular, aplicarExemplo, aoMudarConfig,
    idsTotal: ['custo_mensal', 'guardar', 'custo_anual'], idsDesconto: ['inss_total', 'irrf_total', 'vt_desconto'],
    focoInicial: () => (tipo.valor === 'mensalista' ? salario.input : valorHora.input),
  };
}
