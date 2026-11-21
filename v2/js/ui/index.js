// Tabela de Ganhos v2 — componentes de interface (ponto único de importação para as telas: ctx.ui).
// Regra: nenhum componente usa innerHTML; todo texto entra como texto.
export { h, anexar, trocar, idUnico, urlSegura, linkExterno } from './el.js';
export { icone, NOMES_ICONES } from './icones.js';
export { botao, cabecalhoTela, estadoVazio, tabela, anunciar, carregarCss } from './basicos.js';
export { campoDinheiro, campoNumero, campoTexto, campoSelecao, segmentos, seletorDias } from './campos.js';
export { cartaoResultado, listaResumo, listaConta, alerta, alertas, selo, selosDoPasso, TIPOS_SELO } from './resultado.js';
export { folha, confirmar, toast } from './sobreposicoes.js';
