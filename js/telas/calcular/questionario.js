// Tabela de Ganhos v2 — tela Calcular: questionário curto "Não sei qual é o meu" (4 perguntas, Fase 1).
// Sugere o modo e mostra o alerta de vínculo quando couber. Texto cauteloso: "pode ser", nunca "é".

/**
 * Sugere o modo a partir das respostas.
 * @param {{ casa?: 'sim'|'nao', dias?: 'menos'|'1'|'2'|'3', paga?: 'hora'|'dia'|'mes', fixo?: 'sim'|'nao' }} r
 * @returns {{ modo: string, titulo: string, texto: string, alertas: object[] } | null}
 */
export function sugerirModo(r, motor, dataISO) {
  if (!r.casa || !r.dias || !r.paga || !r.fixo) return null;
  const F = motor.FONTES;
  if (r.casa === 'nao') {
    const alertas = [];
    if (r.fixo === 'sim' && r.dias !== 'menos') {
      alertas.push({
        nivel: 'atencao', codigo: 'vinculo_clt', titulo: 'Pode ser emprego com carteira',
        texto: 'Quando a mesma pessoa trabalha com frequência, recebe pagamento e segue horário e ordens, pode haver vínculo de emprego (CLT, art. 3º). Quem decide é a Justiça, olhando os fatos.',
        fonte_url: F.clt, lei: 'CLT, art. 3º',
      });
    }
    return {
      modo: 'porHora', titulo: 'Sugestão: Por hora',
      texto: 'Para um negócio, o modo Por hora mostra o valor do serviço no mês. Os modos para empresa (carteira por hora, intermitente) ficam para uma próxima versão.',
      alertas,
    };
  }
  if (r.dias === '3') {
    return {
      modo: 'domestico', titulo: 'Sugestão: Doméstico',
      texto: 'Com 3 dias ou mais por semana na mesma casa, pode ser emprego doméstico. O modo Doméstico mostra o custo com carteira assinada, guia DAE, 13º e férias.',
      alertas: motor.alertasVinculoDomestico({ diasSemana: 3, mesmaResidencia: true }, dataISO),
    };
  }
  const alertas = r.dias === '2' ? motor.alertasVinculoDomestico({ diasSemana: 2, mesmaResidencia: true }, dataISO) : [];
  if (r.fixo === 'sim') {
    alertas.push({
      nivel: 'info', codigo: 'horario_fixo', titulo: 'Horário e ordens fixas',
      texto: 'Até 2 dias por semana, a LC 150 não considera emprego doméstico, mesmo com horário fixo. Se os dias aumentarem, pode virar emprego doméstico.',
      fonte_url: F.lc150, lei: 'LC 150, art. 1º',
    });
  }
  return {
    modo: 'diarista', titulo: 'Sugestão: Diarista',
    texto: `Até 2 dias por semana na mesma casa, o modo Diarista mostra o custo do mês${r.paga === 'hora' ? ' (escolha "Por hora" no jeito de pagar)' : r.paga === 'mes' ? ' (pode pagar por mês, mas a conta é pelos dias)' : ''}. Não há 13º, férias nem FGTS por essa lei.`,
    alertas,
  };
}

/**
 * Abre a folha do questionário. aoEscolher(modo) é chamado ao tocar em "Usar este modo".
 * @returns {Promise<string|null>} o modo escolhido ou null
 */
export async function abrirQuestionario(ctx, { dataISO, aoEscolher }) {
  const { ui, motor } = ctx;
  const respostas = {};
  let sugestao = null;
  let escolhido = null;
  const resultado = ui.h('div', { class: 'calc-quest-resultado', 'aria-live': 'polite' });

  const pergunta = (chave, rotulo, opcoes, dica = null) => ui.segmentos({
    rotulo, variante: opcoes.length > 2 ? 'livre' : 'igual', opcoes, dica,
    aoMudar: (v) => { respostas[chave] = v; atualizar(); },
  });

  function atualizar() {
    sugestao = sugerirModo(respostas, motor, dataISO);
    if (!sugestao) {
      const faltam = 4 - ['casa', 'dias', 'paga', 'fixo'].filter((k) => respostas[k]).length;
      ui.trocar(resultado, ui.h('p', { class: 'texto-2' }, `Responda ${faltam === 1 ? 'mais 1 pergunta' : `mais ${faltam} perguntas`} para ver a sugestão.`));
      return;
    }
    ui.trocar(resultado,
      ui.h('p', { class: 'calc-quest-sugestao' }, ui.h('strong', null, sugestao.titulo)),
      ui.h('p', null, sugestao.texto),
      sugestao.alertas.map((a) => ui.alerta(a)));
  }

  const conteudo = ui.h('div', { class: 'calc-quest', dataset: { tela: 'calcular' } },
    ui.h('p', { class: 'texto-2' }, 'Quatro perguntas rápidas. Nada fica guardado.'),
    pergunta('casa', '1. O trabalho é na sua casa, para a sua família?', [
      { valor: 'sim', texto: 'Sim, na minha casa' }, { valor: 'nao', texto: 'Não, é para um negócio' }]),
    pergunta('dias', '2. Quantos dias por semana?', [
      { valor: 'menos', texto: 'Menos de 1' }, { valor: '1', texto: '1 dia' }, { valor: '2', texto: '2 dias' }, { valor: '3', texto: '3 ou mais' }]),
    pergunta('paga', '3. Você paga por hora, por dia ou por mês?', [
      { valor: 'hora', texto: 'Por hora' }, { valor: 'dia', texto: 'Por dia' }, { valor: 'mes', texto: 'Por mês' }]),
    pergunta('fixo', '4. Há horário fixo e você dá as ordens do dia a dia?', [
      { valor: 'sim', texto: 'Sim' }, { valor: 'nao', texto: 'Não, a pessoa organiza' }]),
    resultado);
  atualizar();

  const f = ui.folha({
    titulo: 'Qual é o meu caso?',
    conteudo,
    acoes: [
      { texto: 'Cancelar' },
      {
        texto: 'Usar este modo', variante: 'primario',
        aoClicar: () => {
          if (!sugestao) { ctx.anunciar('Responda as 4 perguntas primeiro.'); resultado.querySelector('p')?.classList.add('calc-quest-falta'); return false; }
          escolhido = sugestao.modo;
          return undefined;
        },
      },
    ],
  });
  f.corpo.querySelector('.chip')?.focus();
  await f.fechado;
  if (escolhido && aoEscolher) aoEscolher(escolhido);
  return escolhido;
}
