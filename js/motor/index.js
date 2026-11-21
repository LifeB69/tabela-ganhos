// Motor de cálculo da Tabela de Ganhos v2 — ponto único de importação.
// Funções puras, dinheiro em centavos inteiros, sem acesso a tela, rede ou armazenamento.
export {
  PARAMETROS, PARAMETROS_VERSAO, DATA_CONFERENCIA, DATA_ROBO, FONTES, UFS, anoDosValores,
  getParam, getParamComReserva, valorParam, listarParametros, listarVigencias, listarMudancasFuturas,
  dataValida, diasEntre,
} from './parametros.js';
export {
  parseDinheiro, lerCentavos, formatarBRL, formatarNumero, formatarPct, porExtenso,
  arredondarPara, aplicarPct, dividirArredondando,
} from './dinheiro.js';
export { obterJornada, obterMinimo, horaMinima, pisoDomestico, datasJornada } from './jornada.js';
export { calcularInss, inssProgressivo } from './inss.js';
export { calcularIrrf, irrfMensal, reducaoLei15270 } from './irrf.js';
export { calcularPorHora, calcularPorHoraInverso } from './porHora.js';
export { calcularDiarista, contarDiasDaSemanaNoMes } from './diarista.js';
export { calcularDomestico, vencimentoDae, ehDiaUtil } from './domestico.js';
export { converterSalario, tabelaMinimo, tabelaPisos, tabelaComparacao, proximasMudancas } from './salarios.js';
export {
  alertasVinculoDomestico, alertasValorHora, alertasSalarioMensal, alertasMudancaJornada,
  alertasTempoParcialDomestico, alertasMudancasProximas,
} from './alertas.js';
