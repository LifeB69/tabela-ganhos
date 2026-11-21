// Tabela de Ganhos v2 — parâmetros legais datados.
//
// Regras deste arquivo:
// - Dinheiro sempre em CENTAVOS inteiros (unidade 'centavos'). Ex.: R$ 1.621,00 = 162100.
// - Alíquotas em porcentagem decimal (campo *_pct). Ex.: 7,5% = 7.5.
// - Cada parâmetro tem uma lista de vigências. O motor escolhe a vigência pela data de referência.
// - status: 'vigente'        = conferido em fonte (pode ter data futura, ex.: 42 h em 16/12/2026);
//           'previsto'       = anunciado, mas não oficial: mostrado com selo, NÃO entra no cálculo;
//           'nao_verificado' = sem fonte primária: só informação ou opção desligada, com selo.
// - Só entram números CONFIRMADOS/CORRIGIDOS na pesquisa (docs/PLANO.md, seção 5) e os pendentes
//   fechados em 20/11/2026.
// - Quando a lei mudar, troque só este arquivo e a constante PARAMETROS_VERSAO_MANUAL.
// - O robô (robo/, docs/ROBO.md) grava vigências conferidas em fonte oficial em
//   dados/parametros-auto.js. Elas são MESCLADAS aqui (mesclarAuto): nunca apagam nem trocam uma
//   vigência oficial escrita à mão; só substituem uma 'previsto' ou 'nao_verificado' de mesma data.

import AUTO from './parametros-auto.js';

const RE_ISO = /^\d{4}-\d{2}-\d{2}$/;
const STATUS_AUTO = new Set(['vigente', 'previsto']);

export const PARAMETROS_VERSAO_MANUAL = '2026-11-20';
export const DATA_CONFERENCIA_MANUAL = '2026-11-20';

/** Data (AAAA-MM-DD) da última vez que o robô mudou dados/parametros-auto.js, ou null. */
export const DATA_ROBO = dataDoRobo(AUTO);

/** Versão e data efetivas: a mais recente entre a conferência manual e a do robô. */
export const PARAMETROS_VERSAO = maiorData(PARAMETROS_VERSAO_MANUAL, DATA_ROBO);
export const DATA_CONFERENCIA = maiorData(DATA_CONFERENCIA_MANUAL, DATA_ROBO);

const URL = {
  decreto12797: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/decreto/d12797.htm',
  senadoMinimo2027: 'https://www12.senado.leg.br/noticias/materias/2026/08/31/executivo-envia-orcamento-de-2027-ao-congresso-com-minimo-de-r-1.741',
  ec141: 'https://planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc141.htm',
  stfLiminar: 'https://noticias.stf.jus.br/?p=167784',
  decreto13173: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D13173.htm',
  clt: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm',
  lc150: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp150.htm',
  lei605: 'https://www.planalto.gov.br/ccivil_03/leis/l0605.htm',
  inss: 'https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal',
  salarioFamilia: 'https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-familia/valor-limite-para-direito-ao-salario-familia',
  irrf2026: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2026',
  lei15270: 'https://planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15270.htm',
  carneLeao: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/carne-leao',
  manualEsocialDomestico: 'https://www.gov.br/esocial/pt-br/documentacao-tecnica/manuais/manual-do-esocial-empregador-domestico-versao-13-08-2026.pdf',
  daeVencimento: 'https://www.gov.br/esocial/pt-br/noticias/mudanca-na-data-de-vencimento-do-dae',
  lei8036: 'https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm',
  lei8212: 'https://www.planalto.gov.br/ccivil_03/leis/l8212cons.htm',
  lei10666: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.666.htm',
  lei8620: 'https://www.planalto.gov.br/ccivil_03/leis/l8620.htm',
  decreto10854: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/decreto/d10854.htm',
  lei4090: 'https://www.planalto.gov.br/ccivil_03/leis/l4090.htm',
  lei4749: 'https://www.planalto.gov.br/ccivil_03/leis/l4749.htm',
  lc123: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
  lc238: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp238.htm',
  dasMei2026: 'https://www8.receita.fazenda.gov.br/simplesnacional/Noticias/NoticiaCompleta.aspx?id=c3b2044c-ff97-432a-b33c-ecf2a3df6dc3',
  meiDiarista: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/quero-ser-mei/atividades-permitidas/d',
  pisoSP: 'https://www.al.sp.gov.br/repositorio/legislacao/lei/2026/lei-18471-27.05.2026.html',
  pisoRS: 'https://www.estado.rs.gov.br/reajuste-do-piso-salarial-regional-ja-esta-em-vigor-apos-publicacao-no-diario-oficial-do-estado-nesta-quinta-21',
  pisoSC: 'https://portalelegis.alesc.sc.gov.br/documentos/djwp6',
  pisoPR: 'https://www.parana.pr.gov.br/Audio/Parana-renova-piso-salarial-para-ate-R-24-mil-e-deve-manter-maior-valor-do-Brasil-em-2026',
  pisoRJ: 'https://www.legisweb.com.br/legislacao/?id=375749',
};

export const FONTES = URL;

const parametros = [
  // ───────────────────────── Salário mínimo ─────────────────────────
  {
    chave: 'salario_minimo',
    rotulo: 'Salário mínimo nacional',
    unidade: 'centavos',
    vigencias: [
      {
        valor: { mensal: 162100, diario: 5404, horario: 737 },
        vigente_desde: '2026-01-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.decreto12797,
        lei: 'Decreto 12.797/2025, art. 1º e parágrafo único',
        observacao: 'R$ 1.621,00 por mês, R$ 54,04 por dia e R$ 7,37 por hora (hora calculada pelo divisor 220).',
      },
      {
        valor: { mensal: 174100 },
        vigente_desde: '2027-01-01',
        vigente_ate: null,
        status: 'previsto',
        fonte_url: URL.senadoMinimo2027,
        lei: 'PLN 24/2026 (proposta de orçamento de 2027)',
        observacao: 'Valor previsto no orçamento enviado ao Congresso; a LDO previa R$ 1.717. O valor final sai por decreto. Não entra no cálculo.',
      },
    ],
  },

  // ───────────────────────── Jornada e repouso (EC 141/2026) ─────────────────────────
  {
    chave: 'jornada_semanal',
    rotulo: 'Jornada semanal máxima',
    unidade: 'horas',
    vigencias: [
      {
        valor: 44,
        vigente_desde: '1988-10-05',
        vigente_ate: '2026-12-15',
        status: 'vigente',
        fonte_url: URL.clt,
        lei: 'CF art. 7º, XIII (redação original); CLT art. 58; LC 150, art. 2º',
        observacao: '8 h por dia e 44 h por semana.',
      },
      {
        valor: 42,
        marco: 'jornada_42',
        vigente_desde: '2026-12-16',
        vigente_ate: '2027-12-15',
        status: 'vigente',
        fonte_url: URL.ec141,
        lei: 'EC 141/2026, arts. 6º, I, e 10; liminar do STF nas ADIs 8041 e 8042 (pendente de referendo)',
        observacao: 'Publicada no DOU de 16/10/2026 (edição extra); 42 h dois meses após a publicação. A liminar do STF (min. Flávio Dino) fixa o início em 16/12/2026 e, sem acordo ou convenção até 15/12/2026, permite até 8h24 por dia em 5 dias, sem pagar os 24 minutos como extra até 15/12/2027. Há quem conte o prazo até 17/12/2026. Rever quando o Plenário do STF julgar.',
        fonte_url_extra: URL.stfLiminar,
      },
      {
        valor: 40,
        marco: 'jornada_40',
        vigente_desde: '2027-12-16',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.ec141,
        lei: 'EC 141/2026, art. 6º, II',
        observacao: '40 h por semana um ano depois da etapa de 42 h.',
      },
    ],
  },
  {
    chave: 'jornada_diaria',
    rotulo: 'Jornada diária máxima',
    unidade: 'horas',
    vigencias: [
      {
        valor: 8,
        vigente_desde: '1988-10-05',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.clt,
        lei: 'CF art. 7º, XIII; CLT art. 58; LC 150, art. 2º; EC 141/2026 mantém 8 h',
        observacao: 'Até 2 h extras por dia (CLT art. 59).',
      },
    ],
  },
  {
    chave: 'repouso_semanal_dias',
    rotulo: 'Dias de repouso semanal remunerado',
    unidade: 'dias',
    vigencias: [
      {
        valor: 1,
        vigente_desde: '1949-01-05',
        vigente_ate: '2026-12-15',
        status: 'vigente',
        fonte_url: URL.lei605,
        lei: 'Lei 605/1949, art. 1º; CF art. 7º, XV (redação original)',
        observacao: '24 h seguidas, de preferência no domingo.',
      },
      {
        valor: 2,
        marco: 'jornada_42',
        vigente_desde: '2026-12-16',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.ec141,
        lei: 'EC 141/2026, art. 10, I (novo inciso XV do art. 7º da CF)',
        observacao: 'Dois dias de repouso, um de preferência no domingo. A regulamentação do DSR cabe ao Ministro do Trabalho e Emprego (Decreto 13.173/2026, art. 4º), ainda não publicada.',
      },
    ],
  },
  {
    chave: 'divisor_hora',
    rotulo: 'Divisor do salário-hora (mensalista)',
    unidade: 'horas',
    vigencias: [
      {
        valor: 220,
        vigente_desde: '1988-10-05',
        vigente_ate: '2026-12-15',
        status: 'vigente',
        fonte_url: URL.lc150,
        lei: 'LC 150, art. 2º, §2º (doméstico); CLT (jornada de 44 h)',
        observacao: 'Divisor menor vale se o contrato estipular jornada mensal inferior.',
      },
      {
        valor: 210,
        marco: 'jornada_42',
        vigente_desde: '2026-12-16',
        vigente_ate: '2027-12-15',
        status: 'vigente',
        fonte_url: URL.decreto13173,
        lei: 'Decreto 13.173/2026, art. 5º (e art. 1º, parágrafo único, para domésticos)',
        observacao: 'Divisor 210 enquanto a jornada máxima for de 42 h. Prevalece, em qualquer hipótese, o divisor mais favorável ao empregado (menor, por lei, convenção, acordo ou contrato). A LC 150 ainda diz 220; o Decreto 13.173/2026 aplica 210/200 também ao doméstico.',
      },
      {
        valor: 200,
        marco: 'jornada_40',
        vigente_desde: '2027-12-16',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.decreto13173,
        lei: 'Decreto 13.173/2026, art. 5º',
        observacao: 'Divisor 200 quando a jornada máxima for de 40 h. Prevalece o divisor mais favorável ao empregado.',
      },
    ],
  },

  // ───────────────────────── Hora extra, noturno, domingos e feriados ─────────────────────────
  {
    chave: 'hora_extra',
    rotulo: 'Hora extra',
    unidade: 'percentual',
    vigencias: [
      {
        valor: { percentual_minimo: 50, limite_diario_horas: 2 },
        vigente_desde: '1988-10-05',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.clt,
        lei: 'CF art. 7º, XVI; CLT art. 59, §1º; LC 150, art. 2º, §1º',
        observacao: 'Pelo menos 50% a mais que a hora normal.',
      },
    ],
  },
  {
    chave: 'dobro_domingo_feriado_domestico',
    rotulo: 'Doméstico: domingo e feriado não compensados em dobro',
    unidade: 'percentual',
    vigencias: [
      {
        valor: { percentual: 100 },
        vigente_desde: '2015-06-02',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.lc150,
        lei: 'LC 150, art. 2º, §8º',
        observacao: 'O trabalho não compensado prestado em domingos e feriados deve ser pago em dobro, sem prejuízo da remuneração do repouso semanal.',
      },
    ],
  },
  {
    chave: 'dobro_feriado_clt',
    rotulo: 'CLT: feriado trabalhado sem folga em dobro',
    unidade: 'percentual',
    vigencias: [
      {
        valor: { percentual: 100 },
        vigente_desde: '1949-01-05',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.lei605,
        lei: 'Lei 605/1949, art. 9º',
        observacao: 'Pago em dobro, salvo se o empregador determinar outro dia de folga.',
      },
    ],
  },
  {
    chave: 'dobro_domingo_clt',
    rotulo: 'CLT: domingo trabalhado sem folga em dobro',
    unidade: 'percentual',
    vigencias: [
      {
        valor: { percentual: 100 },
        vigente_desde: '1949-01-05',
        vigente_ate: null,
        status: 'nao_verificado',
        fonte_url: null,
        lei: 'Súmula 146 do TST',
        observacao: 'A extensão do dobro aos domingos depende da Súmula 146 do TST, não conferida em fonte primária.',
      },
    ],
  },
  {
    chave: 'adicional_noturno',
    rotulo: 'Adicional noturno',
    unidade: 'percentual',
    vigencias: [
      {
        valor: { percentual_minimo: 20, hora_noturna_segundos: 3150, inicio: '22:00', fim: '05:00' },
        vigente_desde: '1943-11-10',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.lc150,
        lei: 'CLT art. 73; LC 150, art. 14',
        observacao: 'Das 22h às 5h; hora noturna de 52 min 30 s; adicional de pelo menos 20%. Trabalhador rural segue outra lei (não coberto).',
      },
    ],
  },

  // ───────────────────────── Doméstico: tempo parcial ─────────────────────────
  {
    chave: 'tempo_parcial_domestico',
    rotulo: 'Doméstico em tempo parcial',
    unidade: 'horas',
    vigencias: [
      {
        valor: {
          limite_horas_semana: 25,
          ferias_por_faixa: [
            { ate_horas: 5, dias: 8 },
            { ate_horas: 10, dias: 10 },
            { ate_horas: 15, dias: 12 },
            { ate_horas: 20, dias: 14 },
            { ate_horas: 22, dias: 16 },
            { ate_horas: 25, dias: 18 },
          ],
        },
        vigente_desde: '2015-06-02',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.lc150,
        lei: 'LC 150, art. 3º',
        observacao: 'Até 25 h por semana, salário proporcional e férias de 8 a 18 dias conforme as horas semanais.',
      },
    ],
  },

  // ───────────────────────── INSS e IRRF ─────────────────────────
  {
    chave: 'inss_empregado',
    rotulo: 'INSS do empregado, doméstico e avulso (progressivo)',
    unidade: 'centavos',
    vigencias: [
      {
        valor: {
          faixas: [
            { ate: 162100, aliquota_pct: 7.5 },
            { ate: 290284, aliquota_pct: 9 },
            { ate: 435427, aliquota_pct: 12 },
            { ate: 847555, aliquota_pct: 14 },
          ],
          teto: 847555,
        },
        vigente_desde: '2026-01-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.inss,
        lei: 'Portaria Interministerial MPS/MF 13/2026 (competência 01/2026)',
        observacao: 'Desconto máximo R$ 988,09 (soma das faixas, conta derivada). Tabela de 2027 ainda não publicada.',
      },
    ],
  },
  {
    chave: 'inss_13_separado',
    rotulo: 'INSS do 13º em separado',
    unidade: 'regra',
    vigencias: [
      {
        valor: { separado: true, desconta_na_parcela: 2 },
        vigente_desde: '1993-07-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.lei8620,
        lei: 'Lei 8.620/1993, art. 7º, §2º',
        observacao: 'A contribuição incide sobre o valor bruto do 13º, com aplicação em separado das alíquotas. O desconto vai na 2ª parcela (a 1ª parcela sai sem INSS).',
      },
    ],
  },
  {
    chave: 'salario_familia',
    rotulo: 'Salário-família',
    unidade: 'centavos',
    vigencias: [
      {
        valor: { cota_por_filho: 6754, limite_remuneracao: 198038 },
        vigente_desde: '2026-01-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.salarioFamilia,
        lei: 'Portaria Interministerial MPS/MF 13/2026',
        observacao: 'Por filho ou equiparado de até 14 anos, ou inválido de qualquer idade.',
      },
    ],
  },
  {
    chave: 'irrf_mensal',
    rotulo: 'IRRF — tabela mensal',
    unidade: 'centavos',
    vigencias: [
      {
        valor: {
          faixas: [
            { ate: 242880, aliquota_pct: 0, deducao: 0 },
            { ate: 282665, aliquota_pct: 7.5, deducao: 18216 },
            { ate: 375105, aliquota_pct: 15, deducao: 39416 },
            { ate: 466468, aliquota_pct: 22.5, deducao: 67549 },
            { ate: null, aliquota_pct: 27.5, deducao: 90873 },
          ],
          dependente: 18959,
          desconto_simplificado: 60720,
          parcela_isenta_65: 190398,
        },
        vigente_desde: '2026-01-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.irrf2026,
        lei: 'Lei 15.191/2025 (tabela aplicada desde 01/2026, segundo a Receita Federal)',
        observacao: 'Usa-se o que for mais favorável: deduções legais (INSS + dependentes) ou desconto simplificado. Tabela de 2027 não publicada.',
      },
    ],
  },
  {
    chave: 'irrf_redutor',
    rotulo: 'Redução do IR (Lei 15.270/2025)',
    unidade: 'centavos',
    vigencias: [
      {
        valor: {
          limite_reducao_total: 500000,
          reducao_maxima: 31289,
          limite_superior: 735000,
          constante: 97862,
          fator_milionesimos: 133145,
        },
        vigente_desde: '2026-01-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.lei15270,
        lei: 'Lei 15.270/2025 (art. 3º-A da Lei 9.250/1995)',
        observacao: 'Até R$ 5.000,00: redução de até R$ 312,89 (o imposto zera). De R$ 5.000,01 a R$ 7.350,00: redução = 978,62 − 0,133145 × rendimento bruto tributável. Acima: sem redução. Vale também para o 13º. A redução nunca passa do imposto calculado.',
      },
    ],
  },

  // ───────────────────────── Encargos ─────────────────────────
  {
    chave: 'encargos_domestico',
    rotulo: 'Encargos do empregador doméstico (Simples Doméstico)',
    unidade: 'percentual',
    vigencias: [
      {
        valor: { cpp_pct: 8, gilrat_pct: 0.8, fgts_pct: 8, indenizacao_pct: 3.2 },
        vigente_desde: '2015-10-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.manualEsocialDomestico,
        lei: 'LC 150, arts. 22 e 34; Lei 8.212, art. 24 (redação da Lei 13.202/2015); Manual do eSocial Doméstico de 13/08/2026, p. 78',
        observacao: '8% CPP + 0,8% GILRAT + 8% FGTS + 3,2% indenização compensatória = 20% sobre a remuneração.',
      },
    ],
  },
  {
    chave: 'fgts',
    rotulo: 'FGTS',
    unidade: 'percentual',
    vigencias: [
      {
        valor: { aliquota_pct: 8, aprendiz_pct: 2, multa_dispensa_pct: 40, dia_deposito: 20 },
        vigente_desde: '2022-09-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.lei8036,
        lei: 'Lei 8.036/1990, arts. 15 e 18 (dia 20 pela Lei 14.438/2022)',
        observacao: 'Multa de 40% na dispensa sem justa causa (para o doméstico, coberta pelos 3,2% mensais).',
      },
    ],
  },
  {
    chave: 'vt_desconto',
    rotulo: 'Vale-transporte: desconto do empregado',
    unidade: 'percentual',
    vigencias: [
      {
        valor: { aliquota_pct: 6 },
        vigente_desde: '2021-12-11',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.decreto10854,
        lei: 'Decreto 10.854/2021, arts. 114 a 116; LC 150, art. 19',
        observacao: 'O empregado paga até 6% do salário básico (sem adicionais) e nunca mais do que o vale custa; o empregador paga o resto. Desconto proporcional aos vales do período. O VT não é salário (art. 111).',
      },
    ],
  },
  {
    chave: 'dae_vencimento',
    rotulo: 'Vencimento do DAE (Simples Doméstico)',
    unidade: 'dia',
    vigencias: [
      {
        valor: { dia: 20, regra: 'antecipa_dia_util' },
        vigente_desde: '2024-03-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.daeVencimento,
        lei: 'Lei 8.212, art. 30, V, e Lei 8.036, art. 15 (redação da Lei 14.438/2022); Manual do eSocial Doméstico de 13/08/2026, p. 80',
        observacao: 'Até o dia 20 do mês seguinte, antecipado se não for dia útil (desde a competência 03/2024). O texto compilado da LC 150, art. 35, ainda diz dia 7 (desatualizado).',
      },
    ],
  },
  {
    chave: 'prazos_13',
    rotulo: 'Prazos do 13º salário',
    unidade: 'datas',
    vigencias: [
      {
        valor: { primeira_parcela_ate: '11-30', segunda_parcela_ate: '12-20' },
        vigente_desde: '1965-07-13',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.lei4749,
        lei: 'Lei 4.749/1965; Lei 4.090/1962, art. 1º; Manual do eSocial Doméstico de 13/08/2026',
        observacao: '1ª parcela entre fevereiro e 30 de novembro; 2ª até 20 de dezembro. 1/12 por mês trabalhado; 15 dias ou mais contam como mês inteiro.',
      },
    ],
  },
  {
    chave: 'dae_13_vencimento',
    rotulo: 'Vencimento do DAE do 13º (doméstico)',
    unidade: 'data',
    vigencias: [
      {
        valor: { dia_mes: '01-20' },
        vigente_desde: '2024-03-01',
        vigente_ate: null,
        status: 'nao_verificado',
        fonte_url: URL.manualEsocialDomestico,
        lei: 'Manual do eSocial Doméstico de 13/08/2026, seção 4.1.7.2',
        observacao: 'Vencimento em 20/01 citado na pesquisa, mas não reconferido no fechamento dos pendentes. Não afirmar como certo.',
      },
    ],
  },

  // ───────────────────────── Autônomo ─────────────────────────
  {
    chave: 'autonomo',
    rotulo: 'INSS do contribuinte individual (autônomo)',
    unidade: 'percentual',
    vigencias: [
      {
        valor: {
          normal_pct: 20,
          simplificado_pct: 11,
          base_minima: 162100,
          base_maxima: 847555,
          dia_recolhimento: 15,
        },
        vigente_desde: '2026-01-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.inss,
        lei: 'Lei 8.212, arts. 21 e 30, II; Portaria Interministerial MPS/MF 13/2026',
        observacao: '20% sobre a renda entre R$ 1.621,00 e R$ 8.475,55 (R$ 324,20 a R$ 1.695,11) ou 11% sobre o mínimo no plano simplificado (R$ 178,31, sem aposentadoria por tempo de contribuição). Recolhe até o dia 15.',
      },
    ],
  },
  {
    chave: 'autonomo_retencao_empresa',
    rotulo: 'Retenção do autônomo por empresa',
    unidade: 'percentual',
    vigencias: [
      {
        valor: { aliquota_pct: 11, teto_base: 847555, patronal_pct: 20, dia_recolhimento: 20 },
        vigente_desde: '2026-01-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.lei10666,
        lei: 'Lei 10.666/2003, art. 4º; Lei 8.212, art. 22, III',
        observacao: 'Empresa retém 11% (até o teto: máx. R$ 932,31, derivado) e paga 20% patronal. Pessoa física que contrata não retém.',
      },
    ],
  },

  // ───────────────────────── MEI ─────────────────────────
  {
    chave: 'mei_limite_anual',
    rotulo: 'MEI: limite de receita anual',
    unidade: 'centavos',
    vigencias: [
      {
        valor: 8100000,
        vigente_desde: '2018-01-01',
        vigente_ate: '2026-12-31',
        status: 'vigente',
        fonte_url: URL.lc123,
        lei: 'LC 123, art. 18-A, §1º',
        observacao: 'R$ 6.750 por mês no ano de início.',
      },
      {
        valor: 11000000,
        vigente_desde: '2027-01-01',
        vigente_ate: '2027-12-31',
        status: 'previsto',
        fonte_url: URL.lc238,
        lei: 'LC 238/2026, art. 2º',
        observacao: 'Publicada no DOU de 21/10/2026, mas a ampliação está condicionada às leis orçamentárias (art. 3º). R$ 9.166,67 por mês no ano de início.',
      },
      {
        valor: 14000000,
        vigente_desde: '2028-01-01',
        vigente_ate: null,
        status: 'previsto',
        fonte_url: URL.lc238,
        lei: 'LC 238/2026, art. 2º',
        observacao: 'Condicionada às leis orçamentárias (art. 3º). R$ 11.666,67 por mês no ano de início.',
      },
    ],
  },
  {
    chave: 'mei_das',
    rotulo: 'MEI: DAS mensal',
    unidade: 'centavos',
    vigencias: [
      {
        valor: { inss: 8105, icms: 100, iss: 500 },
        vigente_desde: '2026-01-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.dasMei2026,
        lei: 'Lei 8.212, art. 21, §2º, II, a (5% do mínimo); LC 123, art. 18-A, §3º, V',
        observacao: 'R$ 81,05 de INSS + R$ 1 (comércio/indústria) e/ou R$ 5 (serviços): R$ 82,05, R$ 86,05 ou R$ 87,05. Vencimento no dia 20 não verificado em fonte primária.',
      },
    ],
  },
  {
    chave: 'mei_diarista',
    rotulo: 'MEI: Diarista Independente',
    unidade: 'regra',
    vigencias: [
      {
        valor: { permitido: true, cnae: '9700-5/00' },
        vigente_desde: '2018-11-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.meiDiarista,
        lei: 'Resolução CGSN 140/2018, Anexo XI',
        observacao: 'A ocupação "Diarista Independente" pode ser MEI. Se recolhe ISS ou ICMS: não verificado.',
      },
    ],
  },

  // ───────────────────────── Vínculo doméstico ─────────────────────────
  {
    chave: 'vinculo_domestico',
    rotulo: 'Doméstico: mais de 2 dias por semana',
    unidade: 'dias',
    vigencias: [
      {
        valor: { dias_semana_a_partir_de: 3 },
        vigente_desde: '2015-06-02',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.lc150,
        lei: 'LC 150, art. 1º',
        observacao: 'Doméstico: serviço contínuo, subordinado, oneroso, pessoal, sem fim lucrativo, na residência, por mais de 2 dias por semana.',
      },
    ],
  },

  // ───────────────────────── Pisos estaduais do doméstico ─────────────────────────
  {
    chave: 'piso_domestico_SP',
    rotulo: 'Piso estadual do doméstico — SP',
    unidade: 'centavos',
    uf: 'SP',
    vigencias: [
      {
        valor: 187436,
        vigente_desde: '2026-06-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.pisoSP,
        lei: 'Lei estadual 18.471/2026 (SP), art. 1º, I',
        observacao: 'Inclui cuidadores de idoso e de pessoa com deficiência. Não vale onde houver piso de convenção ou acordo coletivo.',
      },
    ],
  },
  {
    chave: 'piso_domestico_RS',
    rotulo: 'Piso estadual do doméstico — RS',
    unidade: 'centavos',
    uf: 'RS',
    vigencias: [
      {
        valor: 188475,
        vigente_desde: '2026-05-21',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.pisoRS,
        lei: 'Lei 16.514/2026 (RS) — número conferido em fonte secundária',
        observacao: 'Faixa 1, que inclui empregados domésticos. Publicada no DOE-RS de 21/05/2026, data-base em 1º de maio.',
      },
    ],
  },
  {
    chave: 'piso_domestico_SC',
    rotulo: 'Piso estadual do doméstico — SC',
    unidade: 'centavos',
    uf: 'SC',
    vigencias: [
      {
        valor: 184200,
        vigente_desde: '2026-01-01',
        vigente_ate: null,
        status: 'vigente',
        fonte_url: URL.pisoSC,
        lei: 'LC estadual 895/2026 (SC), que altera a LC 459/2009',
        observacao: 'Faixa I. A inclusão dos domésticos na faixa I vem de fonte secundária.',
      },
    ],
  },
  {
    chave: 'piso_domestico_PR',
    rotulo: 'Piso estadual do doméstico — PR',
    unidade: 'centavos',
    uf: 'PR',
    vigencias: [
      {
        valor: 218163,
        grupos: { I: 210534, II: 218163, III: 225004, IV: 240790 },
        grupo_padrao: 'II',
        vigente_desde: '2026-01-01',
        vigente_ate: '2026-12-31',
        status: 'vigente',
        fonte_url: URL.pisoPR,
        lei: 'Resolução CETER 632/2026 (PR); notícia do Governo do PR de 19/01/2026',
        observacao: 'Enquadramento do doméstico no Grupo II deduzido pela CBO (GG 5); convenção coletiva da categoria prevalece. Revisar em janeiro de 2027.',
      },
    ],
  },
  {
    chave: 'piso_domestico_RJ',
    rotulo: 'Piso estadual do doméstico — RJ',
    unidade: 'centavos',
    uf: 'RJ',
    vigencias: [
      {
        valor: 123811,
        vigente_desde: '2019-01-01',
        vigente_ate: null,
        status: 'nao_verificado',
        fonte_url: URL.pisoRJ,
        lei: 'Lei estadual 8.315/2019 (RJ)',
        observacao: 'Não verificado em fonte primária; abaixo do mínimo nacional. Só informação: o cálculo usa o mínimo nacional (maior entre piso e mínimo).',
      },
    ],
  },
];

/** Lista escrita à mão, antes da mescla com o robô (o robô lê esta). */
export const PARAMETROS_MANUAIS = parametros;

// ───────────────────────── Mescla com o robô ─────────────────────────

/** Data de hoje em Brasília (AAAA-MM-DD), ou null se o ambiente não souber fusos. */
function hojeBrasilia(agora = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
  } catch {
    return null;
  }
}

/**
 * Data (de Brasília) da última gravação do robô. Usa gerado_em_brasilia; sem ela, converte gerado_em
 * (UTC) para Brasília. Nunca devolve data depois de hoje (um relógio adiantado não vira selo no futuro).
 */
export function dataDoRobo(auto) {
  if (!auto) return null;
  let g = typeof auto.gerado_em_brasilia === 'string' && RE_ISO.test(auto.gerado_em_brasilia) ? auto.gerado_em_brasilia : null;
  if (!g && typeof auto.gerado_em === 'string') {
    const d = new Date(auto.gerado_em);
    g = Number.isNaN(d.getTime()) ? null : hojeBrasilia(d);
  }
  if (!g || !RE_ISO.test(g)) return null;
  const hoje = hojeBrasilia();
  return hoje && g > hoje ? hoje : g;
}

function maiorData(a, b) {
  if (!b) return a;
  return b > a ? b : a;
}

function vespera(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d - 1)).toISOString().slice(0, 10);
}

/** Só endereço de órgão público brasileiro (gov.br) serve de fonte para o robô. */
const RE_FONTE_OFICIAL = /^https:\/\/([a-z0-9-]+\.)*gov\.br(\/|$)/i;

/** Parâmetros que o robô pode gravar. Qualquer outra chave em parametros-auto.js é ignorada. */
export const CHAVES_DO_ROBO = ['salario_minimo', 'inss_empregado', 'salario_familia', 'mei_das', 'autonomo', 'autonomo_retencao_empresa'];

/** Aumento máximo aceito de um ano para o outro sem conferência humana (mesmo número de robo/config.js). */
const AUMENTO_MAXIMO_AUTO_PCT = 15;
const ALIQUOTAS_INSS_AUTO = [7.5, 9, 12, 14];

/** Uma vigência do robô só entra se tiver o mínimo que o app exige de qualquer vigência. */
export function vigenciaAutoValida(v) {
  return !!v && typeof v === 'object'
    && STATUS_AUTO.has(v.status)
    && typeof v.vigente_desde === 'string' && RE_ISO.test(v.vigente_desde)
    && (v.vigente_ate === null || v.vigente_ate === undefined || (RE_ISO.test(v.vigente_ate) && v.vigente_ate >= v.vigente_desde))
    && v.valor !== undefined && v.valor !== null
    && typeof v.lei === 'string' && v.lei.length > 0
    && typeof v.fonte_url === 'string' && /^https:\/\//.test(v.fonte_url);
}

const inteiro = (x) => Number.isInteger(x) && x > 0;
const mesmasChaves = (a, b) => !!a && !!b && typeof a === 'object' && typeof b === 'object'
  && JSON.stringify(Object.keys(a).sort()) === JSON.stringify(Object.keys(b).sort());
const subiuAte = (novo, antigo, max = AUMENTO_MAXIMO_AUTO_PCT) => inteiro(novo) && inteiro(antigo) && novo >= antigo && ((novo - antigo) / antigo) * 100 <= max;
const oficialNa = (lista, data) => lista.filter((x) => x.status === 'vigente' && x.vigente_desde <= data)
  .sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde))[0] || null;
const oficialAntesDe = (lista, data) => lista.filter((x) => x.status === 'vigente' && x.vigente_desde < data)
  .sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde))[0] || null;
/** Vigência oficial que começa no mesmo ano de `data` (o robô só grava vigências de 1º de janeiro). */
const oficialDoAno = (lista, data) => {
  const v = oficialNa(lista, data);
  return v && v.vigente_desde.slice(0, 4) === data.slice(0, 4) ? v : null;
};

/**
 * Confere uma vigência do robô pelo formato e pelas regras do parâmetro (não só pelo formato geral).
 * `lista(chave)` = vigências já mescladas. Devolve a lista de problemas (vazia = passa).
 */
function problemasDaVigencia(chave, v, lista) {
  const p = [];
  if (!CHAVES_DO_ROBO.includes(chave)) return [`o robô não grava "${chave}"`];
  if (!vigenciaAutoValida(v)) return ['campos obrigatórios faltando ou inválidos'];
  if (!RE_FONTE_OFICIAL.test(v.fonte_url)) p.push(`fonte fora do gov.br: ${v.fonte_url}`);
  if (!v.vigente_desde.endsWith('-01-01')) p.push(`vigência ${v.vigente_desde} não é 1º de janeiro`);
  const x = v.valor;
  const desde = v.vigente_desde;
  const ant = oficialAntesDe(lista(chave), desde);
  if (!ant) return [...p, 'sem vigência oficial anterior para comparar'];
  const a = ant.valor;
  if (v.status === 'previsto') {
    if (chave !== 'salario_minimo') p.push('o robô só grava projeção do salário mínimo');
    else if (!mesmasChaves(x, { mensal: 0 }) || !(inteiro(x.mensal) && x.mensal > a.mensal && subiuAte(x.mensal, a.mensal))) p.push('projeção do mínimo fora do esperado');
    return p;
  }
  const min = oficialDoAno(lista('salario_minimo'), desde);
  const inss = oficialDoAno(lista('inss_empregado'), desde);
  switch (chave) {
    case 'salario_minimo': {
      if (!mesmasChaves(x, { mensal: 0, diario: 0, horario: 0 })) { p.push('valor sem mensal/diario/horario'); break; }
      if (!(inteiro(x.mensal) && x.mensal > a.mensal && subiuAte(x.mensal, a.mensal))) p.push(`mensal ${x.mensal} fora de (anterior ${a.mensal}, +${AUMENTO_MAXIMO_AUTO_PCT}%]`);
      if (x.diario !== null && !(inteiro(x.diario) && x.diario >= Math.floor(x.mensal / 30) && x.diario <= Math.ceil(x.mensal / 30))) p.push(`diário ${x.diario} não é mensal ÷ 30`);
      if (x.horario !== null && !(inteiro(x.horario) && x.horario >= Math.floor(x.mensal / 220) && x.horario <= Math.ceil(x.mensal / 220))) p.push(`horário ${x.horario} não é mensal ÷ 220`);
      break;
    }
    case 'inss_empregado': {
      if (!mesmasChaves(x, { faixas: 0, teto: 0 }) || !Array.isArray(x.faixas)) { p.push('valor sem faixas/teto'); break; }
      const al = x.faixas.map((f) => f && f.aliquota_pct);
      if (JSON.stringify(al) !== JSON.stringify(ALIQUOTAS_INSS_AUTO)) p.push(`alíquotas ${al.join('/')} (esperado ${ALIQUOTAS_INSS_AUTO.join('/')})`);
      x.faixas.forEach((f, i) => {
        if (!mesmasChaves(f, { ate: 0, aliquota_pct: 0 }) || !inteiro(f.ate)) p.push(`faixa ${i + 1} malformada`);
        else if (i > 0 && !(f.ate > x.faixas[i - 1].ate)) p.push(`faixa ${i + 1} não é crescente`);
      });
      const ult = x.faixas[x.faixas.length - 1];
      if (!ult || x.teto !== ult.ate) p.push('teto diferente do fim da última faixa');
      if (!min) p.push('sem mínimo oficial do mesmo ano');
      else if (!x.faixas[0] || x.faixas[0].ate !== min.valor.mensal) p.push('1ª faixa diferente do mínimo oficial do mesmo ano');
      if (!subiuAte(x.teto, a.teto)) p.push(`teto ${x.teto} fora de [${a.teto}, +${AUMENTO_MAXIMO_AUTO_PCT}%]`);
      break;
    }
    case 'salario_familia': {
      if (!mesmasChaves(x, a)) { p.push('chaves diferentes das da vigência anterior'); break; }
      for (const k of ['cota_por_filho', 'limite_remuneracao']) if (!subiuAte(x[k], a[k])) p.push(`${k} fora de [anterior, +${AUMENTO_MAXIMO_AUTO_PCT}%]`);
      break;
    }
    case 'mei_das': {
      if (!mesmasChaves(x, a)) { p.push('chaves diferentes das da vigência anterior'); break; }
      if (!min) p.push('sem mínimo oficial do mesmo ano');
      else if (x.inss !== Math.round((min.valor.mensal * 5) / 100)) p.push('INSS do MEI não é 5% do mínimo');
      if (x.icms !== a.icms || x.iss !== a.iss) p.push('ICMS/ISS do MEI mudaram');
      break;
    }
    case 'autonomo': {
      if (!mesmasChaves(x, a)) { p.push('chaves diferentes das da vigência anterior'); break; }
      for (const k of Object.keys(a)) if (k !== 'base_minima' && k !== 'base_maxima' && x[k] !== a[k]) p.push(`${k} mudou`);
      if (!min || x.base_minima !== min.valor.mensal) p.push('base mínima diferente do mínimo oficial do mesmo ano');
      if (!inss || x.base_maxima !== inss.valor.teto) p.push('base máxima diferente do teto do INSS do mesmo ano');
      break;
    }
    case 'autonomo_retencao_empresa': {
      if (!mesmasChaves(x, a)) { p.push('chaves diferentes das da vigência anterior'); break; }
      for (const k of Object.keys(a)) if (k !== 'teto_base' && x[k] !== a[k]) p.push(`${k} mudou`);
      if (!inss || x.teto_base !== inss.valor.teto) p.push('teto diferente do teto do INSS do mesmo ano');
      break;
    }
    default:
  }
  return p;
}

/** Mescla sem conferência de regras (só os campos obrigatórios). */
function mesclarBruto(manuais, extras) {
  return manuais.map((def) => {
    const lista = Array.isArray(extras[def.chave]) ? extras[def.chave] : [];
    if (!lista.length) return def;
    let vig = def.vigencias.map((v) => ({ ...v }));
    for (const a of lista) {
      if (!vigenciaAutoValida(a)) continue;
      const novo = { ...a, vigente_ate: a.vigente_ate ?? null, origem: 'robo' };
      const i = vig.findIndex((v) => v.vigente_desde === a.vigente_desde);
      if (i < 0) { vig.push(novo); continue; }
      const atual = vig[i];
      if (atual.status === 'vigente' && atual.origem !== 'robo') continue;   // oficial à mão vence
      if (novo.status === 'previsto' && atual.status === 'vigente') continue;
      vig[i] = novo;
    }
    vig.sort((x, y) => x.vigente_desde.localeCompare(y.vigente_desde));
    const oficiais = vig.filter((v) => v.status === 'vigente');
    for (let i = 0; i < oficiais.length - 1; i++) {
      const v = oficiais[i];
      const prox = oficiais[i + 1];
      if ((v.origem === 'robo' || prox.origem === 'robo') && (v.vigente_ate === null || v.vigente_ate >= prox.vigente_desde)) {
        v.vigente_ate = vespera(prox.vigente_desde);
      }
    }
    return { ...def, vigencias: vig };
  });
}

/**
 * Confere as vigências do robô e devolve { aceitas: { chave: [...] }, recusadas: [{ chave, vigente_desde, problemas }] }.
 * Repete até estabilizar: se o mínimo de um ano é recusado, os derivados dele (MEI, autônomo, INSS) caem juntos.
 */
function conferirAuto(manuais, auto) {
  const extras = (auto && auto.vigencias && typeof auto.vigencias === 'object') ? auto.vigencias : {};
  const aceitas = {};
  for (const [k, l] of Object.entries(extras)) if (Array.isArray(l)) aceitas[k] = [...l];
  const recusadas = [];
  for (let volta = 0; volta < 10; volta++) {
    const mesclado = mesclarBruto(manuais, aceitas);
    const lista = (chave) => (mesclado.find((p) => p.chave === chave) || { vigencias: [] }).vigencias;
    let tirou = false;
    for (const [chave, l] of Object.entries(aceitas)) {
      if (!manuais.some((p) => p.chave === chave)) { recusadas.push({ chave, vigente_desde: null, problemas: ['parâmetro que não existe no app'] }); delete aceitas[chave]; tirou = true; continue; }
      aceitas[chave] = l.filter((v) => {
        const problemas = problemasDaVigencia(chave, v, lista);
        if (!problemas.length) return true;
        recusadas.push({ chave, vigente_desde: v && v.vigente_desde, problemas });
        tirou = true;
        return false;
      });
    }
    if (!tirou) break;
  }
  return { aceitas, recusadas };
}

/** Vigências do robô que não passam nas regras do parâmetro (vazia = arquivo do robô em ordem). */
export function problemasAuto(manuais, auto) {
  return conferirAuto(manuais, auto).recusadas;
}

/**
 * Mescla as vigências do robô (auto.vigencias = { chave: [vigência, ...] }) na lista manual.
 * - Só entram vigências que passam na conferência por parâmetro (problemasAuto): fonte gov.br,
 *   formato igual ao da vigência anterior, mínimo subindo até 15%, faixas do INSS 7,5/9/12/14 com
 *   a 1ª igual ao mínimo do ano, MEI = 5% do mínimo etc. O resto é ignorado.
 * - Chave que não existe na lista manual é ignorada (o robô não cria parâmetro novo).
 * - Mesma vigente_desde: a do robô substitui uma 'previsto' ou 'nao_verificado'; uma 'vigente'
 *   escrita à mão sempre fica. Uma 'previsto' do robô nunca troca uma 'vigente'.
 * - A vigência oficial anterior a uma do robô é encerrada na véspera (vigente_ate), sem sobrepor.
 * Não altera os objetos de entrada.
 */
export function mesclarAuto(manuais, auto) {
  return mesclarBruto(manuais, conferirAuto(manuais, auto).aceitas);
}

export default mesclarAuto(parametros, AUTO);
