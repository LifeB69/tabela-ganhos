// Regras puras do robô: decidem o que aplicar, com quais números e com qual texto.
// Nada aqui lê rede ou disco.

/**
 * O diário do mínimo NÃO tem regra fixa de arredondamento: o governo já usou o centavo de baixo
 * (Decreto 8.948/2016: R$ 937 → R$ 31,23; MP 919/2020: R$ 1.045 → R$ 34,83) e o de cima
 * (Decreto 12.797/2025: R$ 1.621 → R$ 54,04). Por isso o robô só grava o diário que leu no decreto;
 * sem decreto, deixa null e o app mostra o diário como "conta do app" (js/motor/jornada.js).
 * Esta função só diz se um diário lido é compatível com mensal ÷ 30 (centavo de baixo ou de cima).
 */
export function diarioCompativel(mensal, diario) {
  return Number.isInteger(diario) && diario >= Math.floor(mensal / 30) && diario <= Math.ceil(mensal / 30);
}

const brl = (c) => `R$ ${(c / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
export { brl };

function pct(novo, antigo) {
  return ((novo - antigo) / antigo) * 100;
}

/**
 * Decide o mínimo do ano Y.
 * entrada: { ano, decreto: { lido, url, numero } | null, motivoDecreto, valorSerie (centavos) | null,
 *            urlSerie, anterior (vigência oficial anterior) | null, aumentoMaximoPct }
 * saída: { acao: 'aplicar' | 'esperar' | 'issue', vigencia?, titulo?, corpo?, resumo }
 */
export function decidirMinimo({ ano, decreto, motivoDecreto, valorSerie, urlSerie, anterior, aumentoMaximoPct }) {
  const ant = anterior ? anterior.valor.mensal : null;
  const plausivel = (m) => Number.isInteger(m) && m > 0 && (ant === null || (m > ant && pct(m, ant) <= aumentoMaximoPct));

  if (decreto && decreto.lido) {
    const d = decreto.lido;
    const problemas = [];
    if (!plausivel(d.mensal)) problemas.push(`mensal ${brl(d.mensal)} fora do esperado (anterior ${ant ? brl(ant) : '?'}, aumento aceito de 0% a ${aumentoMaximoPct}%)`);
    if (!d.vigente_desde || d.vigente_desde.slice(0, 4) !== String(ano)) problemas.push(`data de vigência ${d.vigente_desde} não é de ${ano}`);
    if (d.diario !== null && !diarioCompativel(d.mensal, d.diario)) problemas.push(`diário ${brl(d.diario)} não bate com mensal ÷ 30`);
    if (d.horario !== null && (d.horario < Math.floor(d.mensal / 220) || d.horario > Math.ceil(d.mensal / 220))) problemas.push(`horário ${brl(d.horario)} não bate com mensal ÷ 220`);
    if (problemas.length) {
      return {
        acao: 'issue', resumo: `decreto lido com problemas: ${problemas.join('; ')}`,
        titulo: `Robô: decreto do salário mínimo de ${ano} com valores estranhos`,
        corpo: `Li o decreto ${decreto.numero || ''} em ${decreto.url}, mas não apliquei:\n\n- ${problemas.join('\n- ')}\n\nConfira o texto e, se estiver certo, atualize dados/parametros.js à mão.`,
      };
    }
    if (d.alterado && (valorSerie === null || valorSerie === undefined)) {
      return {
        acao: 'esperar',
        resumo: `decreto ${d.numero || decreto.numero || ''} tem redação alterada ou retificada; só aplico com o Banco Central conferindo ${ano}`,
      };
    }
    if (valorSerie !== null && valorSerie !== undefined && valorSerie !== d.mensal) {
      return {
        acao: 'issue', resumo: `divergência: decreto ${brl(d.mensal)} × BCB ${brl(valorSerie)}`,
        titulo: `Robô: fontes divergem sobre o salário mínimo de ${ano}`,
        corpo: `O decreto (${decreto.url}) diz ${brl(d.mensal)} e a série 1619 do Banco Central (${urlSerie}) diz ${brl(valorSerie)} para janeiro de ${ano}. Não apliquei nada. Confira qual está certo.`,
      };
    }
    const diario = d.diario;
    return {
      acao: 'aplicar',
      resumo: `decreto ${d.numero || decreto.numero}: ${brl(d.mensal)}${valorSerie != null ? ' (confere com o BCB)' : ' (BCB ainda sem o ano novo)'}`,
      vigencia: {
        valor: { mensal: d.mensal, diario, horario: d.horario ?? null },
        vigente_desde: d.vigente_desde,
        vigente_ate: null,
        status: 'vigente',
        fonte_url: decreto.url,
        lei: `Decreto ${d.numero || decreto.numero || ''}${d.data_decreto ? `, de ${d.data_decreto.split('-').reverse().join('/')}` : ''}, art. 1º e parágrafo único`.replace('Decreto ,', 'Decreto,'),
        observacao: `${brl(d.mensal)} por mês, ${brl(diario)} por dia${d.horario ? ` e ${brl(d.horario)} por hora` : ''}, lidos pelo robô no texto do decreto${valorSerie != null ? ' e conferidos na série 1619 do Banco Central' : ''}.${d.horario ? '' : ' Hora pelo divisor da data (conta do app).'}`,
      },
    };
  }

  if (valorSerie !== null && valorSerie !== undefined) {
    if (ant !== null && valorSerie <= ant) {
      return { acao: 'esperar', resumo: `BCB tem ${ano} com ${brl(valorSerie)}, que não é maior que o anterior; espero o decreto` };
    }
    if (!plausivel(valorSerie)) {
      return {
        acao: 'issue', resumo: `BCB com valor estranho para ${ano}: ${brl(valorSerie)}`,
        titulo: `Robô: salário mínimo de ${ano} no Banco Central com valor estranho`,
        corpo: `A série 1619 (${urlSerie}) traz ${brl(valorSerie)} para janeiro de ${ano}, aumento de ${pct(valorSerie, ant).toFixed(2)}%. Não apliquei. O decreto não foi lido: ${motivoDecreto || 'motivo desconhecido'}.`,
      };
    }
    return {
      acao: 'aplicar',
      resumo: `só o BCB: ${brl(valorSerie)} (decreto não lido: ${motivoDecreto || '?'})`,
      vigencia: {
        valor: { mensal: valorSerie, diario: null, horario: null },
        vigente_desde: `${ano}-01-01`,
        vigente_ate: null,
        status: 'vigente',
        fonte_url: urlSerie,
        lei: `Salário mínimo de ${ano} (série 1619 do SGS do Banco Central; decreto não lido pelo robô)`,
        observacao: `${brl(valorSerie)} por mês, da série oficial do Banco Central. Decreto ainda não lido pelo robô (${motivoDecreto || 'motivo desconhecido'}): o valor diário e o horário oficiais ficam sem número, e o app mostra o diário (mensal ÷ 30) e a hora (mensal ÷ divisor) como conta do app. O robô continua procurando o decreto e troca pelos valores dele quando conseguir ler.`,
      },
    };
  }

  return { acao: 'esperar', resumo: `sem valor de ${ano} ainda (decreto: ${motivoDecreto || 'não achado'}; BCB sem o ano)` };
}

/**
 * Projeção do mínimo do ano Y (Lei 14.663/2023 + Lei 15.077/2024):
 * mínimo de Y-1 × (1 + INPC 12 meses até novembro de Y-1) × (1 + PIB real de Y-2 limitado a 0,6%–2,5%),
 * arredondado para o real inteiro de cima (reproduz 2025: R$ 1.518 e 2026: R$ 1.621).
 */
export function projetarMinimo(minimoAnterior, inpcPct, pibPct, limites) {
  const ganho = Math.min(Math.max(pibPct, limites.minimo), limites.maximo);
  const reais = (minimoAnterior / 100) * (1 + inpcPct / 100) * (1 + ganho / 100);
  return { mensal: Math.ceil(Number(reais.toFixed(6))) * 100, ganho_real_pct: ganho };
}

/** DAS do MEI: 5% do mínimo de INSS + R$ 1 de ICMS e/ou R$ 5 de ISS (LC 123, art. 18-A, §3º, V). */
export function derivarMeiDas(minimo, anterior) {
  return {
    inss: Math.round((minimo * 5) / 100),
    icms: anterior && Number.isInteger(anterior.icms) ? anterior.icms : 100,
    iss: anterior && Number.isInteger(anterior.iss) ? anterior.iss : 500,
  };
}

/** Contribuinte individual/facultativo: mesmas alíquotas, base mínima = mínimo, base máxima = teto. */
export function derivarAutonomo(minimo, teto, anterior) {
  return { ...anterior, base_minima: minimo, base_maxima: teto };
}

export function iguais(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
