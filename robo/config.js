// Configuração do robô. Números que NÃO se raspam ficam aqui, escritos à mão, com fonte.

export const USER_AGENT = 'tabela-ganhos-robo (+https://github.com/LifeB69/tabela-ganhos)';
export const REPO_PADRAO = 'LifeB69/tabela-ganhos';
export const ROTULO_ISSUE = 'robô';

export const TIMEOUT_MS = 30000;
export const TENTATIVAS = 3;
export const ESPERA_ENTRE_TENTATIVAS_MS = 3000;

/** Faz um commit de "batimento" se o último commit tiver mais que isto (o GitHub desliga o cron aos 60 dias). */
export const DIAS_BATIMENTO = 45;

/** Aumento máximo aceito sem conferência humana (mínimo, teto do INSS, salário-família). */
export const AUMENTO_MAXIMO_PCT = 15;

/**
 * Crescimento real do PIB (%), por ano, usado na projeção do mínimo (Lei 14.663/2023, art. 3º:
 * mínimo do ano Y = mínimo de Y-1 × (1 + INPC de 12 meses até novembro de Y-1) × (1 + PIB real de Y-2),
 * com o ganho real limitado pela Lei 15.077/2024 a 0,6%–2,5% de 2025 a 2030).
 * Manual de propósito: o IBGE revisa o PIB e o governo usa o número oficial da época.
 * Ano do PIB → %. Acrescente o do ano novo quando o IBGE divulgar (março).
 */
export const PIB_REAL_PCT = {
  2025: 2.3, // IBGE, Contas Nacionais Trimestrais (4º tri/2025); vale para o mínimo de 2027
};
export const GANHO_REAL_LIMITES_PCT = { minimo: 0.6, maximo: 2.5 }; // Lei 15.077/2024

/** Alíquotas que o INSS do empregado precisa manter para o robô aplicar sozinho. */
export const ALIQUOTAS_INSS = [7.5, 9, 12, 14];

export const URLS = {
  bcbMinimo: (anoIni, anoFim) => `https://api.bcb.gov.br/dados/serie/bcdata.sgs.1619/dados?formato=json&dataInicial=01/01/${anoIni}&dataFinal=31/12/${anoFim}`,
  sidraInpc: 'https://apisidra.ibge.gov.br/values/t/1736/n1/all/v/2292/p/last%201',
  inss: 'https://www.gov.br/inss/pt-br/direitos-e-deveres/inscricao-e-contribuicao/tabela-de-contribuicao-mensal',
  salarioFamilia: 'https://www.gov.br/inss/pt-br/direitos-e-deveres/salario-familia/valor-limite-para-direito-ao-salario-familia',
  irrfAno: (ano) => `https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/${ano}`,
  irrfIndice: 'https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas',
};
