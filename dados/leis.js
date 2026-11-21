// Tabela de Ganhos v2 — conteúdo da tela "Leis" (resumos, glossário, perguntas, prazos e mudanças).
//
// Regras deste arquivo:
// - Só fatos conferidos (PLANO.md seção 5, itens CONFIRMADO/CORRIGIDO de docs/pesquisa e os pendentes
//   fechados em docs/MOTOR.md). O que não foi conferido não entra, ou entra com "(não verificado)".
// - Número que existe em dados/parametros.js NUNCA é digitado aqui: use a marcação {chave.caminho}
//   (veja js/telas/leis/texto.js). Assim, quando o parâmetro muda, o texto muda junto.
// - Números que não estão nos parâmetros (horas do estágio, 180 dias do temporário, dias da
//   licença-paternidade…) vão como texto, sempre com a lei na lista de fontes.
// - Português simples, frases curtas, "pode ser" em vez de "é" quando o assunto é enquadramento.
// - Ids em minúsculas com hífen (viram a rota #leis/<id>).

export const LEIS_CONFERIDAS_EM = '2026-11-20';

const U = {
  lc150: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm',
  clt: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  ec141: 'https://planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc141.htm',
  decreto13173: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D13173.htm',
  stf: 'https://noticias.stf.jus.br/?p=167784',
  lei605: 'https://www.planalto.gov.br/ccivil_03/leis/l0605.htm',
  sumula172: 'https://jurisprudencia-backend2.tst.jus.br/rest/documentos/6c4b286ab2338b1f6a8848a7705b8c18',
  lei4090: 'https://www.planalto.gov.br/ccivil_03/leis/l4090.htm',
  lei4749: 'https://www.planalto.gov.br/ccivil_03/leis/l4749.htm',
  lei8620: 'https://www.planalto.gov.br/ccivil_03/leis/l8620.htm',
  manualDomestico: 'https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/manual-do-esocial-empregador-domestico-versao-13-08-2026.pdf',
  lei8036: 'https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm',
  inss: 'https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal',
  salarioFamilia: 'https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-familia/valor-limite-para-direito-ao-salario-familia',
  lei8212: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
  irrf: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026',
  lei15270: 'https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15270.htm',
  carneLeao: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/carne-leao',
  decreto10854: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/decreto/d10854.htm',
  daeVencimento: 'https://www.gov.br/esocial/pt-br/noticias/mudanca-na-data-de-vencimento-do-dae',
  lei10666: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.666.htm',
  lc116: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm',
  lc123: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
  lc238: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp238.htm',
  dasMei: 'https://www8.receita.fazenda.gov.br/simplesnacional/Noticias/NoticiaCompleta.aspx?id=c3b2044c-ff97-432a-b33c-ecf2a3df6dc3',
  meiDiarista: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/quero-ser-mei/atividades-permitidas/d',
  lei11788: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11788.htm',
  manualAprendiz: 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/escola/e-biblioteca/manual-de-aprendizagem-profissional.pdf',
  lei6019: 'https://www.planalto.gov.br/ccivil_03/leis/l6019.htm',
  lei13467: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13467.htm',
  lei15371: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/L15371.htm',
  decreto12797: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm',
  senado2027: 'https://www12.senado.leg.br/noticias/materias/2026/08/31/executivo-envia-orcamento-de-2027-ao-congresso-com-minimo-de-r-1.741',
  trt2: 'https://ww2.trt2.jus.br/noticias/noticias/noticia/prestacao-de-servicos-domesticos-em-tres-dias-na-mesma-semana-gera-vinculo-de-emprego',
  pisoSP: 'https://www.al.sp.gov.br/repositorio/legislacao/lei/2026/lei-18471-27.05.2026.html',
  pisoRS: 'https://www.estado.rs.gov.br/reajuste-do-piso-salarial-regional-ja-esta-em-vigor-apos-publicacao-no-diario-oficial-do-estado-nesta-quinta-21',
  pisoSC: 'https://portalelegis.alesc.sc.gov.br/documentos/djwp6',
  pisoPR: 'https://www.parana.pr.gov.br/Audio/Parana-renova-piso-salarial-para-ate-R-24-mil-e-deve-manter-maior-valor-do-Brasil-em-2026',
};

/** Grupos dos resumos, na ordem da tela. */
export const GRUPOS = [
  { id: 'quem', titulo: 'Quem é quem' },
  { id: 'horas', titulo: 'Horas e jornada' },
  { id: 'direitos', titulo: 'Direitos de quem é empregado' },
  { id: 'guias', titulo: 'Descontos e guias' },
  { id: 'outros', titulo: 'Outras formas de contratar' },
];

/**
 * Resumos. Cada bloco é um parágrafo (texto), { lista: [...] }, { subtitulo } ou { aviso: { nivel, titulo, texto } }.
 * fontes[0] é a lei principal ("Ler na lei oficial ↗"). modos: abre a calculadora nesse modo.
 */
export const TEMAS = [
  // ───────── Quem é quem ─────────
  {
    id: 'domestico-ou-diarista',
    grupo: 'quem',
    titulo: 'Doméstico ou diarista?',
    resumo: 'O número de dias por semana na mesma casa muda tudo.',
    vigencia: 'LC 150, de 01/06/2015, em vigor desde 02/06/2015',
    blocos: [
      'Pode ser **empregado doméstico** quem trabalha para uma pessoa ou família, na casa dela, sem fim de lucro, de forma contínua, pessoal, recebendo ordens e salário, **a partir de {vinculo_domestico.dias_semana_a_partir_de:num} dias por semana**.',
      'Quem vai menos dias à mesma casa costuma ser tratado como **diarista sem vínculo**. Essa é a leitura usual da lei.',
      { lista: [
        'Diarista sem vínculo recebe a diária combinada. Quem contrata não paga 13º, férias, [[dsr|DSR]], [[fgts|FGTS]] nem vale-transporte.',
        'A diarista pode pagar o próprio [[inss|INSS]] como autônoma ou como [[mei|MEI]].',
        'Empregado doméstico tem carteira assinada, [[piso]], férias + [[terco-ferias|1/3]], 13º, FGTS e a guia [[dae|DAE]] todo mês.',
        'É proibido contratar menor de 18 anos para trabalho doméstico.',
      ] },
      'A Justiça do Trabalho de São Paulo (TRT-2) já reconheceu [[vinculo|vínculo]] com 3 dias por semana na mesma casa. Foi decisão de uma turma, em 2023, não uma súmula.',
      { aviso: { nivel: 'atencao', titulo: 'O app diz "pode ser"', texto: 'Quem decide se há vínculo é a Justiça, olhando os fatos de cada caso.' } },
    ],
    fontes: [
      { texto: 'LC 150/2015, art. 1º', url: U.lc150 },
      { texto: 'TRT-2: 3 dias por semana gerou vínculo (2023)', url: U.trt2 },
    ],
    modos: ['diarista', 'domestico'],
    palavras: 'faxineira faxina empregada domestica cuidadora baba vinculo dias por semana',
  },
  {
    id: 'vinculo',
    grupo: 'quem',
    titulo: 'Os 4 sinais de emprego',
    resumo: 'O que a CLT olha para dizer que alguém é empregado.',
    vigencia: 'CLT, art. 3º (Decreto-Lei 5.452/1943)',
    blocos: [
      'Pela CLT, art. 3º, é empregado quem tem os quatro sinais ao mesmo tempo:',
      { lista: [
        '**Pessoa física:** é uma pessoa, não uma empresa.',
        '**Não eventual:** o serviço se repete, faz parte da rotina.',
        '**Sob dependência:** a pessoa recebe ordens de quem paga.',
        '**Com salário:** o trabalho é pago.',
      ] },
      'Se os quatro estiverem presentes, pode haver [[vinculo|vínculo]] de emprego. Ser [[mei|MEI]] não afasta o vínculo quando os sinais estão lá.',
      'O empregado doméstico tem lei própria, a [[lc150|LC 150]]. A [[clt|CLT]] vale para ele só no que a LC 150 não tratar (LC 150, art. 19).',
    ],
    fontes: [
      { texto: 'CLT, art. 3º', url: U.clt },
      { texto: 'LC 150/2015, art. 19', url: U.lc150 },
    ],
    modos: [],
    palavras: 'requisitos subordinacao pessoalidade habitualidade onerosidade carteira registro freela freelancer',
  },

  // ───────── Horas e jornada ─────────
  {
    id: 'jornada',
    grupo: 'horas',
    titulo: 'Jornada e a mudança de dezembro',
    resumo: 'A semana de trabalho fica mais curta em duas etapas (EC 141).',
    vigencia: 'EC 141/2026, publicada em 16/10/2026',
    blocos: [
      'O limite continua de até {jornada_diaria:num} horas por dia. O limite da semana cai em duas etapas:',
      { lista: [
        'Até {jornada_semanal#0:ate}: {jornada_semanal#0:num} horas por semana, 1 dia de descanso, [[divisor]] {divisor_hora#0:num}.',
        'A partir de {jornada_semanal#1:data}: {jornada_semanal#1:num} horas por semana, {repouso_semanal_dias#1:num} dias de descanso pago (um de preferência no domingo), divisor {divisor_hora#1:num}.',
        'A partir de {jornada_semanal#2:data}: {jornada_semanal#2:num} horas por semana, divisor {divisor_hora#2:num}.',
      ] },
      '**O salário não pode diminuir**, nem os pisos. Vale também para o empregado doméstico, porque a Constituição estende a ele essas regras (art. 7º, § 1º).',
      'O divisor transforma o salário do mês em valor da hora: salário ÷ divisor. O Decreto 13.173/2026 (art. 5º) fixa {divisor_hora#1:num} e depois {divisor_hora#2:num}, também para o doméstico. Se contrato, acordo ou convenção der um divisor menor, vale o menor.',
      'Durante a transição, acordo ou convenção coletiva pode aumentar a jornada do dia para distribuir as horas da semana.',
      { aviso: { nivel: 'atencao', titulo: 'Data ainda pode mudar', texto: 'A data de {jornada_semanal#1:data} segue uma liminar do STF (ADIs 8041 e 8042), que ainda precisa ser confirmada pelo Plenário. Pela liminar, sem acordo ou convenção, a jornada pode ter até 8h24 por dia em 5 dias, e esses 24 minutos não são pagos como hora extra até {jornada_semanal#1:ate}. Há quem conte a data a partir do dia seguinte; você pode mudar a data em Mais.' } },
      'Como pagar o trabalho feito no 2º dia de descanso ainda depende de um ato do Ministério do Trabalho (Decreto 13.173/2026, art. 4º), que não saiu.',
    ],
    fontes: [
      { texto: 'Emenda Constitucional 141/2026', url: U.ec141 },
      { texto: 'Decreto 13.173/2026, arts. 4º e 5º', url: U.decreto13173 },
      { texto: 'STF: liminar nas ADIs 8041 e 8042', url: U.stf },
      { texto: 'LC 150/2015, art. 2º', url: U.lc150 },
    ],
    modos: ['domestico'],
    palavras: 'ec 141 6x1 escala 44 horas 42 horas 40 horas reducao jornada divisor 220 210 200 stf liminar',
  },
  {
    id: 'hora-extra',
    grupo: 'horas',
    titulo: 'Hora extra',
    resumo: 'Quanto vale a hora a mais e quando é em dobro.',
    vigencia: 'CLT, arts. 58 e 59; LC 150, art. 2º',
    blocos: [
      'A hora extra vale **pelo menos {hora_extra.percentual_minimo} a mais** que a hora normal. O limite é de {hora_extra.limite_diario_horas:num} horas extras por dia.',
      'Para quem ganha por mês, o valor da hora é o salário ÷ [[divisor]]. Hoje o divisor é {divisor_hora:num}.',
      { lista: [
        '**Doméstico:** domingo ou feriado trabalhado e não compensado com folga é pago em dobro, além do descanso (LC 150, art. 2º, § 8º).',
        '**Empresa (CLT):** feriado trabalhado sem folga em outro dia é pago em dobro (Lei 605/1949, art. 9º).',
      ] },
      'Para o domingo na empresa, a regra do dobro vem de uma súmula do TST que o app ainda não conferiu. Por isso ela fica fora das contas.',
    ],
    fontes: [
      { texto: 'CLT, arts. 58 e 59', url: U.clt },
      { texto: 'LC 150/2015, art. 2º', url: U.lc150 },
      { texto: 'Lei 605/1949, art. 9º', url: U.lei605 },
    ],
    modos: ['domestico'],
    palavras: 'extra 50 por cento dobro domingo feriado 100',
  },
  {
    id: 'noturno',
    grupo: 'horas',
    titulo: 'Trabalho noturno',
    resumo: 'Hora mais curta e adicional sobre o valor.',
    vigencia: 'CLT, art. 73; LC 150, art. 14',
    blocos: [
      'É noturno o trabalho feito das {adicional_noturno.inicio:hora} às {adicional_noturno.fim:hora}.',
      { lista: [
        'A hora noturna é mais curta: {adicional_noturno.hora_noturna_segundos:minseg}. Assim, 7 horas de relógio nesse horário contam como 8 (conta do app).',
        'Cada hora noturna vale **pelo menos {adicional_noturno.percentual_minimo} a mais**.',
      ] },
      'A regra vale para empresa (CLT) e para o empregado doméstico (LC 150). O trabalhador rural segue outra lei, que o app não cobre.',
    ],
    fontes: [
      { texto: 'CLT, art. 73', url: U.clt },
      { texto: 'LC 150/2015, art. 14', url: U.lc150 },
    ],
    modos: ['domestico'],
    palavras: 'noite adicional noturno 20 hora reduzida 52 minutos cuidadora pernoite',
  },
  {
    id: 'dsr',
    grupo: 'horas',
    titulo: 'Descanso semanal remunerado (DSR)',
    resumo: 'A folga paga da semana e como ela entra no salário.',
    vigencia: 'Lei 605/1949, arts. 1º, 6º e 7º',
    blocos: [
      'Todo empregado tem direito a um descanso pago por semana: 24 horas seguidas, de preferência no domingo, além dos feriados.',
      { lista: [
        'Quem ganha **por dia** recebe 1 dia de serviço pelo descanso.',
        'Quem ganha **por hora** recebe a jornada normal de um dia.',
        'As horas extras feitas sempre (habituais) entram nessa conta (Súmula 172 do TST).',
        'Quem ganha **por mês** já tem o descanso dentro do salário.',
        'Quem falta sem justificar na semana perde o DSR daquela semana.',
      ] },
      'A partir de {repouso_semanal_dias#1:data}, passam a ser {repouso_semanal_dias#1:num} dias de descanso por semana (EC 141). A diarista sem [[vinculo|vínculo]] não tem [[dsr|DSR]].',
    ],
    fontes: [
      { texto: 'Lei 605/1949, arts. 1º, 6º e 7º', url: U.lei605 },
      { texto: 'Súmula 172 do TST (acórdão do TST)', url: U.sumula172 },
      { texto: 'Emenda Constitucional 141/2026', url: U.ec141 },
    ],
    modos: ['domestico'],
    palavras: 'repouso semanal remunerado folga domingo descanso horista',
  },

  // ───────── Direitos ─────────
  {
    id: 'ferias',
    grupo: 'direitos',
    titulo: 'Férias + 1/3',
    resumo: '30 dias de descanso pago, com um terço a mais.',
    vigencia: 'Constituição, art. 7º, XVII; LC 150, art. 17',
    blocos: [
      'A cada 12 meses de trabalho, o empregado tem **30 dias de férias**, pagas com **pelo menos [[terco-ferias|1/3]] a mais**.',
      'O empregado doméstico em tempo parcial (até {tempo_parcial_domestico.limite_horas_semana:num} horas por semana) tem de {tempo_parcial_domestico.ferias_por_faixa.0.dias:num} a {tempo_parcial_domestico.ferias_por_faixa.5.dias:num} dias, conforme as horas da semana. Veja o resumo "Intermitente e tempo parcial".',
      'No modo Doméstico, o app mostra quanto guardar por mês para pagar as férias e o 13º.',
      'A diarista sem vínculo não tem férias pagas por quem contrata.',
    ],
    fontes: [
      { texto: 'LC 150/2015, arts. 3º e 17', url: U.lc150 },
    ],
    modos: ['domestico'],
    palavras: 'ferias terco 1/3 um terco 30 dias descanso anual',
  },
  {
    id: 'decimo-terceiro',
    grupo: 'direitos',
    titulo: '13º salário',
    resumo: 'Um salário a mais por ano, pago em duas parcelas.',
    vigencia: 'Lei 4.090/1962 e Lei 4.749/1965',
    blocos: [
      'O 13º vale 1/12 da remuneração por mês trabalhado no ano. Mês com 15 dias ou mais de trabalho conta como mês inteiro.',
      { lista: [
        '**1ª parcela** (metade): entre fevereiro e {prazos_13.primeira_parcela_ate:dm}.',
        '**2ª parcela**: até {prazos_13.segunda_parcela_ate:dm}.',
        'O [[inss|INSS]] do 13º é calculado à parte e descontado na 2ª parcela. A 1ª sai sem INSS.',
        'A redução do Imposto de Renda da Lei 15.270 também vale para o 13º.',
      ] },
      'No doméstico, a guia [[dae|DAE]] do 13º vence em {dae_13_vencimento.dia_mes:dm} do ano seguinte, segundo o Manual do eSocial. O app ainda não reconferiu essa data.',
      'A diarista sem vínculo não tem 13º.',
    ],
    fontes: [
      { texto: 'Lei 4.090/1962, art. 1º', url: U.lei4090 },
      { texto: 'Lei 4.749/1965, arts. 1º e 2º', url: U.lei4749 },
      { texto: 'Lei 8.620/1993, art. 7º (INSS do 13º)', url: U.lei8620 },
      { texto: 'Manual do eSocial Doméstico (13/08/2026)', url: U.manualDomestico },
    ],
    modos: ['domestico'],
    palavras: 'decimo terceiro 13 gratificacao natal parcela novembro dezembro',
  },
  {
    id: 'fgts',
    grupo: 'direitos',
    titulo: 'FGTS',
    resumo: 'Depósito mensal do patrão numa conta do empregado.',
    vigencia: 'Lei 8.036/1990, arts. 15 e 18',
    blocos: [
      'O patrão deposita **{fgts.aliquota_pct}** da remuneração todo mês na conta do [[fgts|FGTS]] do empregado. Não sai do salário. Para o aprendiz, são {fgts.aprendiz_pct}.',
      { lista: [
        '**Empresa:** deposita até o dia {fgts.dia_deposito:num} de cada mês. Na dispensa sem justa causa, paga multa de {fgts.multa_dispensa_pct} sobre os depósitos.',
        '**Doméstico:** além dos {encargos_domestico.fgts_pct}, o patrão paga {encargos_domestico.indenizacao_pct} por mês de indenização, no lugar da multa. Os dois vão na guia [[dae|DAE]].',
      ] },
    ],
    fontes: [
      { texto: 'Lei 8.036/1990, arts. 15 e 18', url: U.lei8036 },
      { texto: 'LC 150/2015, arts. 22 e 34', url: U.lc150 },
    ],
    modos: ['domestico'],
    palavras: 'fundo de garantia deposito multa 40 indenizacao 3,2 compensatoria',
  },
  {
    id: 'vale-transporte',
    grupo: 'direitos',
    titulo: 'Vale-transporte',
    resumo: 'Quem paga a condução e quanto pode ser descontado.',
    vigencia: 'Decreto 10.854/2021, em vigor desde cerca de 11/12/2021',
    blocos: [
      'O patrão dá o vale-transporte para ida e volta do trabalho. Do empregado, pode descontar até **{vt_desconto.aliquota_pct} do salário básico** (sem adicionais). O resto é por conta do patrão.',
      { lista: [
        'O desconto é proporcional aos vales entregues no período.',
        'O vale-transporte não é salário: não entra no [[inss|INSS]], no [[fgts|FGTS]] nem no Imposto de Renda.',
      ] },
    ],
    fontes: [
      { texto: 'Decreto 10.854/2021, arts. 111, 114 e 115', url: U.decreto10854 },
    ],
    modos: ['domestico'],
    palavras: 'vt passagem onibus conducao transporte 6',
  },
  {
    id: 'licenca-paternidade',
    grupo: 'direitos',
    titulo: 'Licença-paternidade a partir de 2027',
    resumo: 'Mais dias para o pai, em etapas. Só para informação.',
    vigencia: 'Lei 15.371/2026, em vigor a partir de 01/01/2027',
    blocos: [
      { lista: [
        '**2027:** 10 dias.',
        '**2028:** 15 dias.',
        '**2029:** 20 dias, só se a meta fiscal for cumprida.',
        'Filho com deficiência: um terço a mais.',
      ] },
      'Quem paga: para o empregado de empresa, a empresa paga e o [[inss|INSS]] devolve. Para o empregado doméstico, o INSS paga direto.',
      { aviso: { nivel: 'info', titulo: 'Só informação', texto: 'O app ainda não calcula a licença-paternidade.' } },
    ],
    fontes: [
      { texto: 'Lei 15.371/2026', url: U.lei15371 },
    ],
    modos: [],
    palavras: 'licenca paternidade pai nascimento filho salario-paternidade',
  },

  // ───────── Descontos e guias ─────────
  {
    id: 'inss',
    grupo: 'guias',
    titulo: 'INSS de quem recebe',
    resumo: 'O desconto da previdência, por faixas.',
    vigencia: 'Portaria Interministerial MPS/MF 13/2026, desde a competência 01/2026',
    blocos: [
      'Empregado, doméstico e avulso pagam [[inss|INSS]] em faixas. Cada porcentagem vale só para a parte do salário que está dentro da faixa:',
      { lista: [
        'até {inss_empregado.faixas.0.ate}: {inss_empregado.faixas.0.aliquota_pct}',
        'até {inss_empregado.faixas.1.ate}: {inss_empregado.faixas.1.aliquota_pct}',
        'até {inss_empregado.faixas.2.ate}: {inss_empregado.faixas.2.aliquota_pct}',
        'até {inss_empregado.faixas.3.ate}: {inss_empregado.faixas.3.aliquota_pct}',
      ] },
      'O teto é {inss_empregado.teto}. Acima disso, o desconto não cresce mais.',
      { subtitulo: 'Quem trabalha por conta própria' },
      { lista: [
        '**Autônomo:** {autonomo.normal_pct} sobre o que ganha no mês (base entre {autonomo.base_minima:brl} e {autonomo.base_maxima:brl}), ou {autonomo.simplificado_pct} sobre o salário mínimo no plano simplificado. Paga até o dia {autonomo.dia_recolhimento:num} do mês seguinte.',
        '**MEI:** o INSS vem dentro do [[das|DAS]]: {mei_das.inss} por mês.',
      ] },
      'Salário-família: {salario_familia.cota_por_filho} por filho de até 14 anos (ou inválido), para quem ganha até {salario_familia.limite_remuneracao}.',
      'A tabela de 2027 ainda não foi publicada.',
    ],
    fontes: [
      { texto: 'Tabela de contribuição mensal (INSS)', url: U.inss },
      { texto: 'Lei 8.212/1991, arts. 21 e 30', url: U.lei8212 },
      { texto: 'Salário-família 2026 (INSS)', url: U.salarioFamilia },
    ],
    modos: ['domestico'],
    palavras: 'previdencia contribuicao desconto aliquota 7,5 9 12 14 teto autonomo salario familia',
  },
  {
    id: 'irrf',
    grupo: 'guias',
    titulo: 'Imposto de Renda na fonte',
    resumo: 'A tabela do mês e a redução que zera o IR até um limite.',
    vigencia: 'Tabela desde 01/2026; Lei 15.270/2025, desde 01/01/2026',
    blocos: [
      'O [[irrf|IR]] é descontado do salário pela tabela do mês:',
      { lista: [
        'até {irrf_mensal.faixas.0.ate}: isento',
        'até {irrf_mensal.faixas.1.ate}: {irrf_mensal.faixas.1.aliquota_pct}, menos {irrf_mensal.faixas.1.deducao}',
        'até {irrf_mensal.faixas.2.ate}: {irrf_mensal.faixas.2.aliquota_pct}, menos {irrf_mensal.faixas.2.deducao}',
        'até {irrf_mensal.faixas.3.ate}: {irrf_mensal.faixas.3.aliquota_pct}, menos {irrf_mensal.faixas.3.deducao}',
        'acima disso: {irrf_mensal.faixas.4.aliquota_pct}, menos {irrf_mensal.faixas.4.deducao}',
      ] },
      'Antes da tabela, desconta-se o INSS e {irrf_mensal.dependente} por dependente. Ou, se for melhor, um desconto simplificado de {irrf_mensal.desconto_simplificado}. O app escolhe o que dá o menor imposto.',
      { subtitulo: 'A redução da Lei 15.270' },
      { lista: [
        'Quem tem rendimento tributável de até {irrf_redutor.limite_reducao_total} no mês tem redução de até {irrf_redutor.reducao_maxima}: o imposto zera.',
        'Acima disso e até {irrf_redutor.limite_superior}, a redução diminui aos poucos.',
        'Acima de {irrf_redutor.limite_superior}, não há redução.',
        'A conta usa o rendimento bruto tributável, não a base já com descontos. Vale também para o 13º.',
      ] },
      'Quem recebe de pessoa física (por exemplo, uma diarista ou um autônomo) acerta pelo carnê-leão, até o último dia útil do mês seguinte.',
    ],
    fontes: [
      { texto: 'Tabelas de 2026 (Receita Federal)', url: U.irrf },
      { texto: 'Lei 15.270/2025', url: U.lei15270 },
      { texto: 'Carnê-leão (Receita Federal)', url: U.carneLeao },
    ],
    modos: ['domestico'],
    palavras: 'imposto de renda ir irrf isencao 5000 cinco mil redutor dependente desconto simplificado carne-leao',
  },
  {
    id: 'dae',
    grupo: 'guias',
    titulo: 'Guia DAE do doméstico',
    resumo: 'Um boleto por mês com tudo junto, que vence no mês seguinte.',
    vigencia: 'Vencimento atual desde a competência 03/2024',
    blocos: [
      'O [[dae|DAE]] é a guia única do [[esocial|eSocial]] Doméstico. Ela junta:',
      { lista: [
        'a parte do patrão: {encargos_domestico.cpp_pct} de INSS ([[cpp|CPP]]) + {encargos_domestico.gilrat_pct} de seguro contra acidente ([[gilrat|GILRAT]]) + {encargos_domestico.fgts_pct} de FGTS + {encargos_domestico.indenizacao_pct} de indenização;',
        'o INSS descontado do empregado;',
        'o Imposto de Renda descontado, se houver.',
      ] },
      'Vence no **dia {dae_vencimento.dia:num} do mês seguinte** à [[competencia|competência]]. Se esse dia não for útil, vence antes, no dia útil anterior. Próximo vencimento: **{=proximoDae}**.',
      'O texto da LC 150 (art. 35) ainda fala em dia 7, mas está desatualizado.',
      'O app considera fins de semana e feriados nacionais. Não considera Carnaval, Corpus Christi nem feriados da sua cidade. A data oficial é a do eSocial.',
    ],
    fontes: [
      { texto: 'eSocial: mudança no vencimento do DAE', url: U.daeVencimento },
      { texto: 'Manual do eSocial Doméstico (13/08/2026)', url: U.manualDomestico },
      { texto: 'LC 150/2015, art. 34', url: U.lc150 },
    ],
    modos: ['domestico'],
    palavras: 'guia boleto esocial simples domestico vencimento dia 20 recolhimento',
  },

  // ───────── Outras formas ─────────
  {
    id: 'autonomo',
    grupo: 'outros',
    titulo: 'Autônomo e RPA',
    resumo: 'Quem presta serviço por conta própria, sem vínculo.',
    vigencia: 'Lei 10.666/2003, art. 4º; Lei 8.212/1991, art. 22',
    blocos: [
      'Autônomo trabalha por conta própria, sem os [[vinculo|4 sinais de emprego]].',
      { lista: [
        '**Pessoa física que contrata:** paga o valor combinado. A lei manda reter o INSS só quando quem contrata é empresa.',
        '**Empresa que contrata:** retém {autonomo_retencao_empresa.aliquota_pct} do valor para o INSS (até o teto) e recolhe até o dia {autonomo_retencao_empresa.dia_recolhimento:num} do mês seguinte. Paga também {autonomo_retencao_empresa.patronal_pct} de INSS da empresa. O recibo com esses descontos é o [[rpa|RPA]].',
        '**ISS:** de 2% a 5%, conforme a cidade. Só é retido se a lei da cidade mandar.',
      ] },
      'O autônomo paga o próprio INSS. Veja o resumo "INSS de quem recebe".',
      { aviso: { nivel: 'info', titulo: 'Ainda sem calculadora', texto: 'O modo Autônomo/RPA chega numa próxima versão. Por enquanto, use o modo Por hora.' } },
    ],
    fontes: [
      { texto: 'Lei 10.666/2003, art. 4º', url: U.lei10666 },
      { texto: 'Lei 8.212/1991, art. 22', url: U.lei8212 },
      { texto: 'LC 116/2003 (ISS), arts. 6º e 8º', url: U.lc116 },
    ],
    modos: ['porHora'],
    palavras: 'autonomo freelancer freela rpa recibo prestador servico iss contribuinte individual',
  },
  {
    id: 'mei',
    grupo: 'outros',
    titulo: 'MEI',
    resumo: 'Limite por ano, imposto fixo e a diarista MEI.',
    vigencia: 'LC 123/2006, art. 18-A; LC 238, de 21/10/2026',
    blocos: [
      'O [[mei|MEI]] tem limite de faturamento por ano:',
      { lista: [
        'até {mei_limite_anual#0:ate}: {mei_limite_anual#0}',
        '{mei_limite_anual#1:ano}: {mei_limite_anual#1}',
        'a partir de {mei_limite_anual#2:ano}: {mei_limite_anual#2}',
      ] },
      'Os limites novos são da LC 238/2026, mas dependem das leis do orçamento. Por isso aparecem como previstos.',
      'Imposto por mês ([[das|DAS]]): {mei_das.inss} de INSS, mais {mei_das.icms} para comércio ou indústria e/ou {mei_das.iss} para serviços.',
      'O MEI pode ter 1 empregado. A partir de 2027, até 2.',
      { subtitulo: 'Diarista MEI' },
      'A diarista pode ser MEI, na ocupação "Diarista Independente" (CNAE {mei_diarista.cnae}). Para quem contrata, o custo é o valor combinado.',
      { aviso: { nivel: 'atencao', titulo: 'MEI não afasta o vínculo', texto: 'Se ela for à mesma casa a partir de {vinculo_domestico.dias_semana_a_partir_de:num} dias por semana, pode ser emprego doméstico, mesmo sendo MEI.' } },
    ],
    fontes: [
      { texto: 'LC 123/2006, arts. 18-A e 18-C', url: U.lc123 },
      { texto: 'LC 238/2026', url: U.lc238 },
      { texto: 'DAS do MEI 2026 (Simples Nacional)', url: U.dasMei },
      { texto: 'Atividades permitidas ao MEI (gov.br)', url: U.meiDiarista },
    ],
    modos: ['diarista'],
    palavras: 'microempreendedor cnpj das limite faturamento 81 mil diarista independente',
  },
  {
    id: 'intermitente-e-parcial',
    grupo: 'outros',
    titulo: 'Intermitente e tempo parcial',
    resumo: 'Contratos com menos horas. Só para informação.',
    vigencia: 'CLT, arts. 58-A e 452-A (Lei 13.467/2017); LC 150, art. 3º',
    blocos: [
      { subtitulo: 'Intermitente (empresa)' },
      { lista: [
        'Contrato escrito, com o valor da hora. A hora não pode ser menor que a do salário mínimo ({salario_minimo.horario}).',
        'A empresa chama com 3 dias corridos de antecedência. A pessoa tem 1 dia útil para responder.',
        'Ao fim de cada período, recebe na hora: o trabalho, férias proporcionais + 1/3, 13º proporcional, [[dsr|DSR]] e adicionais.',
        'INSS e FGTS são recolhidos sobre o que foi pago no mês.',
      ] },
      'Se o intermitente vale para o empregado doméstico é assunto controverso. O app não trata.',
      { subtitulo: 'Tempo parcial (empresa)' },
      'Até 30 horas por semana sem hora extra, ou até 26 horas com até 6 horas extras (pelo menos {hora_extra.percentual_minimo} a mais).',
      { subtitulo: 'Tempo parcial (doméstico)' },
      'Até {tempo_parcial_domestico.limite_horas_semana:num} horas por semana, com salário proporcional. As férias dependem das horas da semana:',
      { lista: [
        'até {tempo_parcial_domestico.ferias_por_faixa.0.ate_horas:num} h: {tempo_parcial_domestico.ferias_por_faixa.0.dias:num} dias',
        'até {tempo_parcial_domestico.ferias_por_faixa.1.ate_horas:num} h: {tempo_parcial_domestico.ferias_por_faixa.1.dias:num} dias',
        'até {tempo_parcial_domestico.ferias_por_faixa.2.ate_horas:num} h: {tempo_parcial_domestico.ferias_por_faixa.2.dias:num} dias',
        'até {tempo_parcial_domestico.ferias_por_faixa.3.ate_horas:num} h: {tempo_parcial_domestico.ferias_por_faixa.3.dias:num} dias',
        'até {tempo_parcial_domestico.ferias_por_faixa.4.ate_horas:num} h: {tempo_parcial_domestico.ferias_por_faixa.4.dias:num} dias',
        'até {tempo_parcial_domestico.ferias_por_faixa.5.ate_horas:num} h: {tempo_parcial_domestico.ferias_por_faixa.5.dias:num} dias',
      ] },
      { aviso: { nivel: 'info', titulo: 'Calculadora', texto: 'O tempo parcial do doméstico já entra no modo Doméstico: informe as horas por semana. Intermitente e tempo parcial de empresa chegam numa próxima versão.' } },
    ],
    fontes: [
      { texto: 'CLT, arts. 58-A e 452-A', url: U.clt },
      { texto: 'Lei 13.467/2017 (reforma trabalhista)', url: U.lei13467 },
      { texto: 'LC 150/2015, art. 3º', url: U.lc150 },
    ],
    modos: ['domestico'],
    palavras: 'intermitente convocacao tempo parcial meio periodo 25 horas 30 horas 26 horas',
  },
  {
    id: 'estagio-aprendiz-temporario',
    grupo: 'outros',
    titulo: 'Estágio, aprendiz e temporário',
    resumo: 'Só para leitura: uma família não pode contratar nenhum dos três.',
    vigencia: 'Lei 11.788/2008; Lei 6.019/1974; Manual de Aprendizagem do MTE',
    blocos: [
      { aviso: { nivel: 'risco', titulo: 'Família ou pessoa física não pode', texto: 'Estes contratos exigem empresa, órgão público ou, no estágio, profissional liberal de nível superior registrado no conselho. Uma família não pode ter estagiário, aprendiz nem temporário em casa.' } },
      { subtitulo: 'Estágio' },
      { lista: [
        'Só empresa, órgão público ou profissional liberal de nível superior registrado.',
        'Jornada de 4 horas por dia e 20 por semana, ou 6 horas por dia e 30 por semana.',
        'No máximo 2 anos na mesma empresa (exceto pessoa com deficiência).',
        'No estágio não obrigatório, bolsa e auxílio-transporte são obrigatórios. Sempre há seguro contra acidentes e recesso de 30 dias a cada ano.',
      ] },
      { subtitulo: 'Aprendiz' },
      { lista: [
        'De 14 a 24 anos incompletos (sem limite de idade para pessoa com deficiência).',
        'Contrato de até 2 anos, com pelo menos o salário mínimo por hora.',
        '6 horas por dia, ou 8 se já terminou o ensino fundamental.',
        'FGTS de {fgts.aprendiz_pct}.',
      ] },
      { subtitulo: 'Temporário' },
      { lista: [
        'Só por meio de empresa de trabalho temporário, para uma empresa que recebe o trabalhador.',
        'Até 180 dias, com mais 90 de prorrogação.',
      ] },
    ],
    fontes: [
      { texto: 'Lei 11.788/2008 (estágio)', url: U.lei11788 },
      { texto: 'Manual de Aprendizagem Profissional (MTE)', url: U.manualAprendiz },
      { texto: 'Lei 6.019/1974 (temporário)', url: U.lei6019 },
      { texto: 'Lei 8.036/1990, art. 15, § 7º', url: U.lei8036 },
    ],
    modos: [],
    palavras: 'estagiario estagio jovem aprendiz aprendizagem temporario trabalho temporario',
  },
];

/** Glossário. tema: id do resumo relacionado (opcional). */
export const GLOSSARIO = [
  { id: 'dsr', termo: 'DSR', nome: 'Descanso semanal remunerado', texto: 'O dia de folga pago da semana, de preferência no domingo. A partir de {repouso_semanal_dias#1:data}, passam a ser {repouso_semanal_dias#1:num} dias.', tema: 'dsr' },
  { id: 'dae', termo: 'DAE', nome: 'Documento de Arrecadação do eSocial', texto: 'A guia única que o patrão doméstico paga todo mês, com INSS, FGTS, seguro contra acidente e Imposto de Renda. Vence no dia {dae_vencimento.dia:num} do mês seguinte.', tema: 'dae' },
  { id: 'fgts', termo: 'FGTS', nome: 'Fundo de Garantia do Tempo de Serviço', texto: 'Depósito de {fgts.aliquota_pct} da remuneração que o patrão faz todo mês numa conta em nome do empregado. Não sai do salário.', tema: 'fgts' },
  { id: 'terco-ferias', termo: '1/3 de férias', nome: 'Terço constitucional de férias', texto: 'O valor a mais pago nas férias: pelo menos um terço do salário do mês de férias.', tema: 'ferias' },
  { id: 'gilrat', termo: 'GILRAT', nome: 'Seguro contra acidente de trabalho', texto: 'Contribuição do patrão para cobrir acidentes de trabalho. No doméstico, {encargos_domestico.gilrat_pct} da remuneração, dentro do DAE.', tema: 'dae' },
  { id: 'cpp', termo: 'CPP', nome: 'Contribuição patronal previdenciária', texto: 'O INSS que o patrão paga, além do que desconta do empregado. No doméstico, {encargos_domestico.cpp_pct}.', tema: 'dae' },
  { id: 'rpa', termo: 'RPA', nome: 'Recibo de Pagamento a Autônomo', texto: 'Recibo que a empresa usa para pagar quem presta serviço sem vínculo, com os descontos de INSS e, se houver, de imposto.', tema: 'autonomo' },
  { id: 'mei', termo: 'MEI', nome: 'Microempreendedor Individual', texto: 'Pequeno negócio com CNPJ, limite de faturamento por ano ({mei_limite_anual#0} até {mei_limite_anual#0:ate}) e imposto fixo por mês, o DAS.', tema: 'mei' },
  { id: 'das', termo: 'DAS', nome: 'Documento de Arrecadação do Simples Nacional', texto: 'A guia mensal do MEI. Em 2026, a parte do INSS é {mei_das.inss}.', tema: 'mei' },
  { id: 'divisor', termo: 'Divisor', nome: 'Divisor do salário-hora', texto: 'Número que transforma o salário do mês em valor da hora: salário ÷ divisor. Hoje é {divisor_hora:num}. Passa a {divisor_hora#1:num} em {divisor_hora#1:data} e a {divisor_hora#2:num} em {divisor_hora#2:data}.', tema: 'jornada' },
  { id: 'competencia', termo: 'Competência', nome: 'Mês de referência', texto: 'O mês a que um pagamento se refere. Exemplo: o salário de novembro é da competência novembro, e a guia dele vence em dezembro.', tema: 'dae' },
  { id: 'esocial', termo: 'eSocial', nome: 'Sistema do governo para o emprego', texto: 'Sistema em que o patrão registra o empregado, informa a folha e tira as guias. O patrão de empregado doméstico usa o eSocial Doméstico.', tema: 'dae' },
  { id: 'piso', termo: 'Piso', nome: 'Piso salarial', texto: 'O menor salário permitido. Alguns estados têm piso do doméstico maior que o mínimo nacional (SP: {piso_domestico_SP}; RS: {piso_domestico_RS}; SC: {piso_domestico_SC}; PR: {piso_domestico_PR}, grupo II). O app usa o maior entre piso e mínimo. Convenção coletiva pode ter outro piso.', tema: 'domestico-ou-diarista' },
  { id: 'vinculo', termo: 'Vínculo', nome: 'Vínculo de emprego', texto: 'A relação de emprego, com direitos como 13º, férias e FGTS. Pode existir mesmo sem carteira assinada, se os sinais de emprego estiverem presentes.', tema: 'vinculo' },
  { id: 'inss', termo: 'INSS', nome: 'Instituto Nacional do Seguro Social', texto: 'A previdência pública. Paga aposentadoria, auxílios e licenças. Quem trabalha contribui todo mês.', tema: 'inss' },
  { id: 'irrf', termo: 'IRRF', nome: 'Imposto de Renda Retido na Fonte', texto: 'O Imposto de Renda descontado direto do pagamento, antes de a pessoa receber.', tema: 'irrf' },
  { id: 'clt', termo: 'CLT', nome: 'Consolidação das Leis do Trabalho', texto: 'A lei principal do emprego. Vale para empresas e, no que a LC 150 não tratar, para o doméstico.', tema: 'vinculo' },
  { id: 'lc150', termo: 'LC 150', nome: 'Lei Complementar 150/2015', texto: 'A lei do emprego doméstico.', tema: 'domestico-ou-diarista' },
];

/** Perguntas frequentes. */
export const PERGUNTAS = [
  {
    id: 'diarista-2-vezes',
    pergunta: 'Diarista 2 vezes por semana tem direito a quê?',
    resposta: [
      'Indo até 2 dias por semana na mesma casa, ela costuma ser diarista sem vínculo: recebe a diária combinada. Quem contrata não paga 13º, férias, DSR, FGTS nem vale-transporte.',
      'Ela pode pagar o próprio INSS como autônoma ou como MEI. A partir de {vinculo_domestico.dias_semana_a_partir_de:num} dias por semana, pode ser emprego doméstico.',
    ],
    tema: 'domestico-ou-diarista',
  },
  {
    id: 'decimo-terceiro-diarista',
    pergunta: 'Preciso pagar 13º para a diarista?',
    resposta: ['Não, se ela for diarista sem vínculo. O 13º é direito de quem é empregado, inclusive o doméstico com carteira.'],
    tema: 'decimo-terceiro',
  },
  {
    id: 'vencimento-guia',
    pergunta: 'Quando vence a guia do empregado doméstico?',
    resposta: ['O DAE vence no dia {dae_vencimento.dia:num} do mês seguinte. Se não for dia útil, vence antes. O próximo vencimento é **{=proximoDae}**.'],
    tema: 'dae',
  },
  {
    id: 'jornada-vai-mudar',
    pergunta: 'A jornada vai mudar?',
    resposta: [
      'Sim. A partir de {jornada_semanal#1:data}, o limite passa a {jornada_semanal#1:num} horas por semana, com {repouso_semanal_dias#1:num} dias de descanso. A partir de {jornada_semanal#2:data}, passa a {jornada_semanal#2:num} horas.',
      'A primeira data segue uma liminar do STF que ainda precisa ser confirmada.',
    ],
    tema: 'jornada',
  },
  {
    id: 'reduzir-salario',
    pergunta: 'Com a jornada menor, posso pagar menos?',
    resposta: ['Não. A EC 141 proíbe reduzir o salário e os pisos por causa da jornada menor.'],
    tema: 'jornada',
  },
  {
    id: 'custo-domestica',
    pergunta: 'Quanto custa uma empregada doméstica com salário mínimo?',
    resposta: [
      'Com salário de {salario_minimo.mensal}, sem extras nem vale-transporte, você paga **{=custoMinimo}** por mês: o salário mais {encargos_domestico.cpp_pct} + {encargos_domestico.gilrat_pct} + {encargos_domestico.fgts_pct} + {encargos_domestico.indenizacao_pct} de encargos.',
      'Ela recebe {=liquidoMinimo} depois do INSS. A guia DAE do mês fica em {=daeMinimo}. O valor oficial é o do eSocial.',
    ],
    tema: 'dae',
  },
  {
    id: 'piso-estado',
    pergunta: 'Meu estado tem piso maior que o mínimo?',
    resposta: [
      'O piso do doméstico é maior que o mínimo nacional em SP ({piso_domestico_SP}), RS ({piso_domestico_RS}), SC ({piso_domestico_SC}) e PR ({piso_domestico_PR}, grupo II; o grupo do doméstico no PR não foi confirmado em fonte oficial).',
      'Nos outros estados vale o mínimo nacional, {salario_minimo.mensal}. Escolha o seu estado em Mais para o app usar o piso.',
    ],
    tema: 'domestico-ou-diarista',
  },
  {
    id: 'minimo-2027',
    pergunta: 'Qual vai ser o salário mínimo em 2027?',
    resposta: ['O orçamento enviado ao Congresso prevê {salario_minimo#1.mensal}. O valor final sai por decreto. Até lá, o app calcula com {salario_minimo.mensal}.'],
    tema: null,
    fonte: { texto: 'Agência Senado: orçamento de 2027', url: U.senado2027 },
  },
  {
    id: 'hora-minima',
    pergunta: 'Qual o valor mínimo da hora?',
    resposta: [
      'O decreto do salário mínimo fixa {salario_minimo.horario} por hora.',
      'A partir de {divisor_hora#1:data}, o app mostra também uma conta própria: o mínimo do mês ÷ {divisor_hora#1:num}. Para quem é pago por hora sem vínculo, o mínimo serve de referência.',
    ],
    tema: 'jornada',
    fonte: { texto: 'Decreto 12.797/2025', url: U.decreto12797 },
  },
  {
    id: 'menor-de-idade',
    pergunta: 'Posso contratar menor de 18 anos como doméstica?',
    resposta: ['Não. A LC 150 proíbe contratar menor de 18 anos para trabalho doméstico.'],
    tema: 'domestico-ou-diarista',
  },
  {
    id: 'estagiario-em-casa',
    pergunta: 'Posso ter um estagiário ou um aprendiz em casa?',
    resposta: ['Não. Estágio, aprendiz e temporário exigem empresa ou órgão público (no estágio, também profissional liberal registrado). Uma família não pode contratar nenhum dos três.'],
    tema: 'estagio-aprendiz-temporario',
  },
  {
    id: 'mei-afasta-vinculo',
    pergunta: 'Se a diarista for MEI, some o risco de vínculo?',
    resposta: ['Não. Ser MEI não afasta o vínculo. Se ela for à mesma casa a partir de {vinculo_domestico.dias_semana_a_partir_de:num} dias por semana, recebendo ordens e salário, pode ser emprego doméstico.'],
    tema: 'mei',
  },
];

/**
 * Calendário de prazos. regra:
 *   { tipo: 'dae' }                                   próximo vencimento do DAE (motor.vencimentoDae)
 *   { tipo: 'anual', chave, caminho }                 data 'MM-DD' de um parâmetro, neste ano ou no próximo
 *   { tipo: 'vigencia', chave, indice }               início da vigência número indice do parâmetro
 *   { tipo: 'data', data: 'AAAA-MM-DD' }              data fixa (lei sem parâmetro no motor)
 */
export const PRAZOS = [
  { id: 'dae-mensal', titulo: 'Guia DAE do mês', texto: 'Todo mês: dia {dae_vencimento.dia:num} do mês seguinte, antecipado se não for dia útil.', regra: { tipo: 'dae' }, tema: 'dae', recorrente: 'Todo mês' },
  { id: '13-primeira', titulo: '13º: 1ª parcela', texto: 'Metade do 13º, paga até esta data.', regra: { tipo: 'anual', chave: 'prazos_13', caminho: 'primeira_parcela_ate' }, tema: 'decimo-terceiro', recorrente: 'Todo ano' },
  { id: '13-segunda', titulo: '13º: 2ª parcela', texto: 'O resto do 13º, já com o desconto do INSS.', regra: { tipo: 'anual', chave: 'prazos_13', caminho: 'segunda_parcela_ate' }, tema: 'decimo-terceiro', recorrente: 'Todo ano' },
  { id: 'dae-13', titulo: 'Guia DAE do 13º (doméstico)', texto: 'Data do Manual do eSocial, ainda não reconferida pelo app.', regra: { tipo: 'anual', chave: 'dae_13_vencimento', caminho: 'dia_mes' }, tema: 'decimo-terceiro', recorrente: 'Todo ano', status: 'nao_verificado' },
  { id: 'jornada-42', titulo: 'Jornada de {jornada_semanal#1:num} horas', texto: 'Começa a semana de {jornada_semanal#1:num} horas, com {repouso_semanal_dias#1:num} dias de descanso pago. Data da liminar do STF, pendente de confirmação.', regra: { tipo: 'vigencia', chave: 'jornada_semanal', indice: 1 }, tema: 'jornada' },
  { id: 'minimo-2027', titulo: 'Novo salário mínimo', texto: 'O mínimo muda todo janeiro. Para 2027, a previsão é {salario_minimo#1.mensal}; o valor final sai por decreto.', regra: { tipo: 'vigencia', chave: 'salario_minimo', indice: 1 }, tema: null, status: 'previsto' },
  { id: 'mei-2027', titulo: 'Novo limite do MEI', texto: 'Limite anual de {mei_limite_anual#1}, se as leis do orçamento permitirem.', regra: { tipo: 'vigencia', chave: 'mei_limite_anual', indice: 1 }, tema: 'mei', status: 'previsto' },
  { id: 'paternidade-2027', titulo: 'Licença-paternidade de 10 dias', texto: 'Começa a valer a Lei 15.371/2026.', regra: { tipo: 'data', data: '2027-01-01' }, tema: 'licenca-paternidade' },
  { id: 'jornada-40', titulo: 'Jornada de {jornada_semanal#2:num} horas', texto: 'Segunda etapa da EC 141: semana de {jornada_semanal#2:num} horas.', regra: { tipo: 'vigencia', chave: 'jornada_semanal', indice: 2 }, tema: 'jornada' },
];

/** O que já mudou (o que vai mudar a tela tira do motor: listarMudancasFuturas). Mais recente primeiro. */
export const MUDANCAS = [
  { data: '2026-11-20', titulo: 'Valores do app revistos', texto: 'Os valores do app foram revistos nesta data. Os pontos sem fonte oficial aparecem com o selo "Não verificado".' },
  { data: '2026-10-21', titulo: 'Novos limites do MEI (LC 238)', texto: 'Limite anual de {mei_limite_anual#1} em 2027 e {mei_limite_anual#2} a partir de 2028, condicionados às leis do orçamento.', fonte: U.lc238, tema: 'mei' },
  { data: '2026-10-16', titulo: 'Jornada menor (EC 141)', texto: 'Semana de {jornada_semanal#1:num} horas a partir de {jornada_semanal#1:data} e de {jornada_semanal#2:num} horas a partir de {jornada_semanal#2:data}, com {repouso_semanal_dias#1:num} dias de descanso. Depois vieram o Decreto 13.173/2026 (divisor {divisor_hora#1:num} e {divisor_hora#2:num}) e a liminar do STF sobre a data.', fonte: U.ec141, tema: 'jornada' },
  { data: '2026-06-01', titulo: 'Piso do doméstico em SP', texto: 'Passa a {piso_domestico_SP#0}, inclusive para cuidadores de idoso e de pessoa com deficiência (Lei estadual 18.471/2026).', fonte: U.pisoSP },
  { data: '2026-05-21', titulo: 'Piso do doméstico no RS', texto: 'Faixa 1, que inclui domésticos: {piso_domestico_RS#0}.', fonte: U.pisoRS },
  { data: '2026-04-01', titulo: 'Lei da licença-paternidade', texto: 'Publicada a Lei 15.371/2026, que vale a partir de 01/01/2027.', fonte: U.lei15371, tema: 'licenca-paternidade' },
  { data: '2026-03-26', titulo: 'Piso de SC', texto: 'Faixa I: {piso_domestico_SC#0}, com efeitos desde 01/01/2026 (LC estadual 895/2026).', fonte: U.pisoSC },
  { data: '2026-01-01', titulo: 'Valores de 2026', texto: 'Salário mínimo de {salario_minimo#0.mensal}; novas tabelas do INSS e do Imposto de Renda; redução do IR para quem ganha até {irrf_redutor#0.limite_reducao_total}; DAS do MEI com INSS de {mei_das#0.inss}; piso do PR (grupo II) de {piso_domestico_PR#0} (data de início ainda não confirmada em fonte oficial).', fonte: U.decreto12797 },
  { data: '2024-03-01', titulo: 'DAE passa a vencer no dia 20', texto: 'Desde a competência 03/2024, a guia do doméstico vence no dia {dae_vencimento.dia:num} do mês seguinte.', fonte: U.daeVencimento, tema: 'dae' },
];
